import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import './LogoLoop.css';

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = value => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }
    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [callback, elements, dependencies]);
};

const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    if (images.length === 0) {
      onLoad();
      return;
    }
    let remainingImages = images.length;
    const handleImageLoad = () => {
      remainingImages -= 1;
      if (remainingImages === 0) onLoad();
    };
    images.forEach(img => {
      const htmlImg = img;
      if (htmlImg.complete) {
        handleImageLoad();
      } else {
        htmlImg.addEventListener('load', handleImageLoad, { once: true });
        htmlImg.addEventListener('error', handleImageLoad, { once: true });
      }
    });
    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [onLoad, seqRef, dependencies]);
};

const useAnimationLoop = (trackRef, targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, isDragging, dragOffset, momentumVelocity) => {
  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const seqSize = isVertical ? seqHeight : seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      const transformValue = isVertical
        ? `translate3d(0, ${-offsetRef.current}px, 0)`
        : `translate3d(${-offsetRef.current}px, 0, 0)`;
      track.style.transform = transformValue;
    }

    const animate = timestamp => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isDragging) {
        // Direct drag - instantly apply the drag offset
        if (seqSize > 0) {
          offsetRef.current = dragOffset;
          const transformValue = isVertical
            ? `translate3d(0, ${-offsetRef.current}px, 0)`
            : `translate3d(${-offsetRef.current}px, 0, 0)`;
          track.style.transform = transformValue;
        }
      } else {
        // Not dragging - use momentum or normal velocity
        const target = momentumVelocity !== 0 ? momentumVelocity : (isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity);

        // Apply momentum decay
        if (momentumVelocity !== 0) {
          const decayFactor = 0.95; // Momentum decay
          velocityRef.current = velocityRef.current * decayFactor;
        } else {
          const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
          velocityRef.current += (target - velocityRef.current) * easingFactor;
        }

        if (seqSize > 0) {
          let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
          nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
          offsetRef.current = nextOffset;

          const transformValue = isVertical
            ? `translate3d(0, ${-offsetRef.current}px, 0)`
            : `translate3d(${-offsetRef.current}px, 0, 0)`;
          track.style.transform = transformValue;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef, isDragging, dragOffset, momentumVelocity]);
};

export const LogoLoop = memo(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    renderItem,
    ariaLabel = 'Partner logos',
    className,
    style
  }) => {
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const seqRef = useRef(null);

    const [seqWidth, setSeqWidth] = useState(0);
    const [seqHeight, setSeqHeight] = useState(0);
    const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState(false);
    
    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [momentumVelocity, setMomentumVelocity] = useState(0);
    const dragStartPosRef = useRef(0);
    const dragStartOffsetRef = useRef(0);
    const lastDragRef = useRef({ pos: 0, time: 0 });
    const currentOffsetRef = useRef(0);

    const effectiveHoverSpeed = useMemo(() => {
      if (hoverSpeed !== undefined) return hoverSpeed;
      if (pauseOnHover === true) return 0;
      if (pauseOnHover === false) return undefined;
      return 0;
    }, [hoverSpeed, pauseOnHover]);

    const isVertical = direction === 'up' || direction === 'down';

    const targetVelocity = useMemo(() => {
      const magnitude = Math.abs(speed);
      let directionMultiplier;
      if (isVertical) {
        directionMultiplier = direction === 'up' ? 1 : -1;
      } else {
        directionMultiplier = direction === 'left' ? 1 : -1;
      }
      const speedMultiplier = speed < 0 ? -1 : 1;
      return magnitude * directionMultiplier * speedMultiplier;
    }, [speed, direction, isVertical]);

    const updateDimensions = useCallback(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const sequenceRect = seqRef.current?.getBoundingClientRect?.();
      const sequenceWidth = sequenceRect?.width ?? 0;
      const sequenceHeight = sequenceRect?.height ?? 0;
      if (isVertical) {
        const parentHeight = containerRef.current?.parentElement?.clientHeight ?? 0;
        if (containerRef.current && parentHeight > 0) {
          const targetHeight = Math.ceil(parentHeight);
          if (containerRef.current.style.height !== `${targetHeight}px`)
            containerRef.current.style.height = `${targetHeight}px`;
        }
        if (sequenceHeight > 0) {
          setSeqHeight(Math.ceil(sequenceHeight));
          const viewport = containerRef.current?.clientHeight ?? parentHeight ?? sequenceHeight;
          const copiesNeeded = Math.ceil(viewport / sequenceHeight) + ANIMATION_CONFIG.COPY_HEADROOM;
          setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
        }
      } else if (sequenceWidth > 0) {
        setSeqWidth(Math.ceil(sequenceWidth));
        const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
      }
    }, [isVertical]);

    useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight, isVertical]);

    useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight, isVertical]);

    useAnimationLoop(trackRef, targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical, isDragging, dragOffset, momentumVelocity);

    // Drag handlers with direct position tracking
    const handleDragStart = useCallback((clientX, clientY) => {
      setIsDragging(true);
      setMomentumVelocity(0);
      const pos = isVertical ? clientY : clientX;
      dragStartPosRef.current = pos;
      dragStartOffsetRef.current = currentOffsetRef.current;
      lastDragRef.current = { pos, time: Date.now() };
    }, [isVertical]);

    const handleDragMove = useCallback((clientX, clientY) => {
      if (!isDragging) return;
      
      const pos = isVertical ? clientY : clientX;
      const delta = pos - dragStartPosRef.current;
      const seqSize = isVertical ? seqHeight : seqWidth;
      
      if (seqSize > 0) {
        // Direct position update - follows pointer exactly
        let newOffset = dragStartOffsetRef.current - delta;
        newOffset = ((newOffset % seqSize) + seqSize) % seqSize;
        setDragOffset(newOffset);
        currentOffsetRef.current = newOffset;
      }
      
      // Track for momentum calculation
      lastDragRef.current = { pos, time: Date.now() };
    }, [isDragging, isVertical, seqWidth, seqHeight]);

    const handleDragEnd = useCallback(() => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      // Calculate momentum from last drag movement
      const now = Date.now();
      const timeDelta = (now - lastDragRef.current.time) / 1000;
      
      if (timeDelta > 0 && timeDelta < 0.1) { // Only apply momentum if drag was recent
        const posDelta = lastDragRef.current.pos - dragStartPosRef.current;
        const velocity = -posDelta / timeDelta * 0.5; // Scale down for smoother momentum
        setMomentumVelocity(velocity);
        
        // Gradually reduce momentum
        setTimeout(() => {
          setMomentumVelocity(0);
        }, 1500);
      } else {
        setMomentumVelocity(0);
      }
    }, [isDragging]);

    // Mouse events
    const handleMouseDown = useCallback((e) => {
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY);
    }, [handleDragStart]);

    const handleMouseMove = useCallback((e) => {
      handleDragMove(e.clientX, e.clientY);
    }, [handleDragMove]);

    const handleMouseUp = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Touch events
    const handleTouchStart = useCallback((e) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }, [handleDragStart]);

    const handleTouchMove = useCallback((e) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }, [handleDragMove]);

    const handleTouchEnd = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Add global mouse/touch listeners when dragging
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    const cssVariables = useMemo(
      () => ({
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        ...(fadeOutColor && { '--logoloop-fadeColor': fadeOutColor })
      }),
      [gap, logoHeight, fadeOutColor]
    );

    const rootClassName = useMemo(
      () =>
        [
          'logoloop',
          isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
          fadeOut && 'logoloop--fade',
          scaleOnHover && 'logoloop--scale-hover',
          className
        ]
          .filter(Boolean)
          .join(' '),
      [isVertical, fadeOut, scaleOnHover, className]
    );

    const handleMouseEnter = useCallback(() => {
      if (effectiveHoverSpeed !== undefined && !isDragging) setIsHovered(true);
    }, [effectiveHoverSpeed, isDragging]);
    
    const handleMouseLeave = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(false);
    }, [effectiveHoverSpeed]);

    const renderLogoItem = useCallback(
      (item, key) => {
        if (renderItem) {
          return (
            <li className="logoloop__item" key={key} role="listitem">
              {renderItem(item, key)}
            </li>
          );
        }
        const isNodeItem = 'node' in item;
        const content = isNodeItem ? (
          <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>
            {item.node}
          </span>
        ) : (
          <img
            src={item.src}
            srcSet={item.srcSet}
            sizes={item.sizes}
            width={item.width}
            height={item.height}
            alt={item.alt ?? ''}
            title={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );
        const itemAriaLabel = isNodeItem ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
        const itemContent = item.href ? (
          <a
            className="logoloop__link"
            href={item.href}
            aria-label={itemAriaLabel || 'logo link'}
            target="_blank"
            rel="noreferrer noopener"
          >
            {content}
          </a>
        ) : (
          content
        );
        return (
          <li className="logoloop__item" key={key} role="listitem">
            {itemContent}
          </li>
        );
      },
      [renderItem]
    );

    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, copyIndex) => (
          <ul
            className="logoloop__list"
            key={`copy-${copyIndex}`}
            role="list"
            aria-hidden={copyIndex > 0}
            ref={copyIndex === 0 ? seqRef : undefined}
          >
            {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
          </ul>
        )),
      [copyCount, logos, renderLogoItem]
    );

    const containerStyle = useMemo(
      () => ({
        width: isVertical
          ? toCssLength(width) === '100%'
            ? undefined
            : toCssLength(width)
          : (toCssLength(width) ?? '100%'),
        cursor: isDragging ? 'grabbing' : 'grab',
        ...cssVariables,
        ...style
      }),
      [width, cssVariables, style, isVertical, isDragging]
    );

    return (
      <div 
        ref={containerRef} 
        className={rootClassName} 
        style={containerStyle} 
        role="region" 
        aria-label={ariaLabel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="logoloop__track" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {logoLists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
