import { memo, useCallback, useRef, useEffect } from 'react';

const ResizeDivider = memo(function ResizeDivider({ direction = 'horizontal', onResize }) {
  const isHorizontal = direction === 'horizontal';
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;

    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      onResize(isHorizontal ? e.clientX : e.clientY);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isHorizontal, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        [isHorizontal ? 'width' : 'height']: '4px',
        [isHorizontal ? 'height' : 'width']: '100%',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        flexShrink: 0,
        background: 'transparent',
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,240,0.2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    />
  );
});

export default ResizeDivider;
