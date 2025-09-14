import React, { useEffect, useRef, useState } from 'react';
import './dr.module.css';

export default function DrawingCanvas({ socketRef, roomId, myColor }) {
  const canvasRef = useRef();
  const [drawing, setDrawing] = useState(false);
  const pointsBuffer = useRef([]);
  const rafRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // no scaling of existing content for simplicity
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    window.addEventListener('resize', resize);

    // load canvas commands when server sends replay
    const onLoad = (e) => {
      const commands = e.detail || [];
      commands.forEach(cmd => {
        if (cmd.type === 'clear') ctx.clearRect(0,0,canvas.width, canvas.height);
        if (cmd.type === 'stroke') {
          const { color, width, points } = cmd.data;
          drawPath(ctx, points, color, width);
        }
      });
    };
    window.addEventListener('wb-load-canvas', onLoad);
    window.addEventListener('wb-clear-canvas', () => ctx.clearRect(0,0,canvas.width,canvas.height));

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('wb-load-canvas', onLoad);
      window.removeEventListener('wb-clear-canvas', () => {});
    };
  }, []);

  // helper to draw path
  function drawPath(ctx, points, color, width) {
    if (!points || points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x * ctx.canvas.width, points[0].y * ctx.canvas.height);
    for (let i=1;i<points.length;i++) {
      ctx.lineTo(points[i].x * ctx.canvas.width, points[i].y * ctx.canvas.height);
    }
    ctx.stroke();
  }

  // handle pointer events
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
    };

    const pointerMove = (e) => {
      const p = getPos(e);
      // send cursor position
      socketRef.current?.emit('cursor-move', { roomId, x: p.x, y: p.y, active: true });
      if (!drawing) return;
      pointsBuffer.current.push(p);
    };
    const pointerDown = (e) => {
      setDrawing(true);
      pointsBuffer.current = [];
      const p = getPos(e);
      pointsBuffer.current.push(p);
      const color = document.getElementById('strokeColor')?.value || myColor || '#000';
      const width = Number(document.getElementById('strokeRange')?.value || 3);
      socketRef.current?.emit('draw-start', { roomId, stroke: { color, width, startPoint: p } });
    };
    const pointerUp = (e) => {
      if (!drawing) return;
      setDrawing(false);
      // send remaining points as draw-end command
      const color = document.getElementById('strokeColor')?.value || myColor || '#000';
      const width = Number(document.getElementById('strokeRange')?.value || 3);
      const command = { type: 'stroke', data: { color, width, points: pointsBuffer.current }, timestamp: new Date() };
      socketRef.current?.emit('draw-end', { roomId, command });
      // draw locally
      drawPath(ctx, pointsBuffer.current, color, width);
      pointsBuffer.current = [];
    };

    canvas.addEventListener('mousedown', pointerDown);
    canvas.addEventListener('touchstart', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('touchmove', pointerMove);
    window.addEventListener('mouseup', pointerUp);
    window.addEventListener('touchend', pointerUp);

    // handle incoming draw events from others
    const socket = socketRef.current;
    socket?.on('draw-start', ({ stroke }) => { /* optional visual */ });
    socket?.on('draw-move', ({ points }) => { /* optional incremental */ });
    socket?.on('draw-end', ({ command }) => {
      if (command.type === 'stroke') drawPath(ctx, command.data.points, command.data.color, command.data.width);
      if (command.type === 'clear') ctx.clearRect(0,0,canvas.width,canvas.height);
    });
    socket?.on('clear-canvas', () => ctx.clearRect(0,0,canvas.width,canvas.height));

    return () => {
      canvas.removeEventListener('mousedown', pointerDown);
      canvas.removeEventListener('touchstart', pointerDown);
      window.removeEventListener('mousemove', pointerMove);
      window.removeEventListener('touchmove', pointerMove);
      window.removeEventListener('mouseup', pointerUp);
      window.removeEventListener('touchend', pointerUp);
      socket?.off('draw-start'); socket?.off('draw-move'); socket?.off('draw-end'); socket?.off('clear-canvas');
    };
  }, [drawing, socketRef, roomId, myColor]);

  return <canvas ref={canvasRef} style={{width:'100%', height:'100%'}} />;
}
