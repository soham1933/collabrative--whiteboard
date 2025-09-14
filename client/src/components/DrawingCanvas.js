
// import React, { useEffect, useRef, useState } from 'react';
// import UserCursors from './UserCursors';
// import './dr.module.css';

// export default function DrawingCanvas({ socketRef, roomId, myColor, cursors }) {
//   const canvasRef = useRef();
//   const [drawing, setDrawing] = useState(false);
//   const pointsBuffer = useRef([]);

//   // 🔹 Resize canvas properly
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const resize = () => {
//       const rect = canvas.getBoundingClientRect();
//       canvas.width = rect.width;
//       canvas.height = rect.height;
//       ctx.lineCap = 'round';
//       ctx.lineJoin = 'round';
//     };
//     resize();
//     window.addEventListener('resize', resize);
//     return () => window.removeEventListener('resize', resize);
//   }, []);

//   // 🔹 Draw helper
//   function drawPath(ctx, points, color, width) {
//     if (!points || points.length === 0) return;
//     ctx.strokeStyle = color;
//     ctx.lineWidth = width;
//     ctx.beginPath();
//     ctx.moveTo(points[0].x * ctx.canvas.width, points[0].y * ctx.canvas.height);
//     for (let i = 1; i < points.length; i++) {
//       ctx.lineTo(points[i].x * ctx.canvas.width, points[i].y * ctx.canvas.height);
//     }
//     ctx.stroke();
//   }

//   // 🔹 Clear canvas (local + emit to others)
//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     socketRef.current?.emit('clear-canvas', { roomId });
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');

//     const getPos = (e) => {
//       const rect = canvas.getBoundingClientRect();
//       const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//       const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//       return {
//         x: (clientX - rect.left) / rect.width,
//         y: (clientY - rect.top) / rect.height,
//       };
//     };

//     const pointerMove = (e) => {
//       const p = getPos(e);
//       socketRef.current?.emit('cursor-update', { roomId, x: p.x, y: p.y, active: true });
//       if (!drawing) return;
//       pointsBuffer.current.push(p);
//     };

//     const pointerDown = (e) => {
//       setDrawing(true);
//       pointsBuffer.current = [];
//       const p = getPos(e);
//       pointsBuffer.current.push(p);

//       const color = document.getElementById('strokeColor')?.value || myColor || '#000';
//       const width = Number(document.getElementById('strokeRange')?.value || 3);

//       socketRef.current?.emit('draw-start', { roomId, stroke: { color, width, startPoint: p } });
//     };

//     const pointerUp = () => {
//       if (!drawing) return;
//       setDrawing(false);

//       const color = document.getElementById('strokeColor')?.value || myColor || '#000';
//       const width = Number(document.getElementById('strokeRange')?.value || 3);

//       const command = { type: 'stroke', data: { color, width, points: pointsBuffer.current } };

//       socketRef.current?.emit('draw-end', { roomId, command });

//       // draw locally
//       drawPath(ctx, pointsBuffer.current, color, width);
//       pointsBuffer.current = [];
//     };

//     // 🔹 Events
//     canvas.addEventListener('mousedown', pointerDown);
//     canvas.addEventListener('touchstart', pointerDown);
//     window.addEventListener('mousemove', pointerMove);
//     window.addEventListener('touchmove', pointerMove);
//     window.addEventListener('mouseup', pointerUp);
//     window.addEventListener('touchend', pointerUp);

//     // 🔹 Socket listeners
//     const socket = socketRef.current;
//     socket?.on('draw-end', ({ command }) => {
//       if (command.type === 'stroke') {
//         drawPath(ctx, command.data.points, command.data.color, command.data.width);
//       }
//     });


//     return () => {
//       canvas.removeEventListener('mousedown', pointerDown);
//       canvas.removeEventListener('touchstart', pointerDown);
//       window.removeEventListener('mousemove', pointerMove);
//       window.removeEventListener('touchmove', pointerMove);
//       window.removeEventListener('mouseup', pointerUp);
//       window.removeEventListener('touchend', pointerUp);

//       socket?.off('draw-end');
//       socket?.off('clear-canvas');
//     };
//   }, [drawing, socketRef, roomId, myColor]);

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
//       <canvas
//         ref={canvasRef}
//         style={{ width: '100%', height: '100%', display: 'block' }}
//       />
//       <button
//         onClick={clearCanvas}
//         style={{
//           position: 'absolute',
//           top: 10,
//           right: 10,
//           zIndex: 10,
//           padding: '6px 12px',
//           background: '#ff4d4f',
//           border: 'none',
//           color: '#fff',
//           borderRadius: '4px',
//           cursor: 'pointer',
//         }}
//       >
//         Clear
//       </button>
//       <UserCursors cursors={cursors} />
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from 'react';
import UserCursors from './UserCursors';
import './dr.module.css';

export default function DrawingCanvas({ socketRef, roomId, myColor, cursors }) {
  const canvasRef = useRef();
  const [drawing, setDrawing] = useState(false);
  const pointsBuffer = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  function drawPath(ctx, points, color, width) {
    if (!points || points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x * ctx.canvas.width, points[0].y * ctx.canvas.height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * ctx.canvas.width, points[i].y * ctx.canvas.height);
    }
    ctx.stroke();
  }

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

      socketRef.current?.emit('cursor-update', { roomId, x: p.x, y: p.y, active: true });

      if (!drawing) return;
      pointsBuffer.current.push(p);

      // 🔹 real-time drawing
      socketRef.current?.emit('draw-move', {
        roomId,
        points: pointsBuffer.current,
        color: document.getElementById('strokeColor')?.value || myColor || '#000',
        width: Number(document.getElementById('strokeRange')?.value || 3)
      });
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

    const pointerUp = () => {
      if (!drawing) return;
      setDrawing(false);

      const color = document.getElementById('strokeColor')?.value || myColor || '#000';
      const width = Number(document.getElementById('strokeRange')?.value || 3);

      const command = { type: 'stroke', data: { color, width, points: pointsBuffer.current } };

      socketRef.current?.emit('draw-end', { roomId, command });

      drawPath(ctx, pointsBuffer.current, color, width);
      pointsBuffer.current = [];
    };

    canvas.addEventListener('mousedown', pointerDown);
    canvas.addEventListener('touchstart', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('touchmove', pointerMove);
    window.addEventListener('mouseup', pointerUp);
    window.addEventListener('touchend', pointerUp);

    const socket = socketRef.current;

    // 🔹 handle incoming events
    socket?.on('draw-start', ({ stroke }) => {});
    socket?.on('draw-move', ({ points, color, width }) => drawPath(ctx, points, color, width));
    socket?.on('draw-end', ({ command }) => {
      if (command.type === 'stroke') drawPath(ctx, command.data.points, command.data.color, command.data.width);
      if (command.type === 'clear') ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    socket?.on('clear-canvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

    // 🔹 replay strokes when joining
    socket?.on('joined', ({ color, strokes }) => {
      if (strokes && strokes.length) {
        strokes.forEach(cmd => {
          if (cmd.type === 'stroke') drawPath(ctx, cmd.data.points, cmd.data.color, cmd.data.width);
        });
      }
    });

    return () => {
      canvas.removeEventListener('mousedown', pointerDown);
      canvas.removeEventListener('touchstart', pointerDown);
      window.removeEventListener('mousemove', pointerMove);
      window.removeEventListener('touchmove', pointerMove);
      window.removeEventListener('mouseup', pointerUp);
      window.removeEventListener('touchend', pointerUp);

      socket?.off('draw-start');
      socket?.off('draw-move');
      socket?.off('draw-end');
      socket?.off('clear-canvas');
      socket?.off('joined');
    };
  }, [drawing, socketRef, roomId, myColor]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <UserCursors cursors={cursors} />
    </div>
  );
}
