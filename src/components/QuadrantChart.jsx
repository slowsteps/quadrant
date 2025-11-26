
import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from './ProductCard';

export default function QuadrantChart() {
    const {
        axes, products, updateProductAxisValues,
        activeXAxisId, activeYAxisId
    } = useApp();

    const containerRef = useRef(null);
    const isResizing = useRef(false);
    const resizeTimeout = useRef(null);
    const [isDraggingEnabled, setIsDraggingEnabled] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const xAxis = axes.find(a => a.id === activeXAxisId);
    const yAxis = axes.find(a => a.id === activeYAxisId);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        // Initial measurement
        updateDimensions();

        const handleResize = () => {
            isResizing.current = true;
            setIsDraggingEnabled(false);
            updateDimensions();

            // Clear existing timeout
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);

            // Reset resizing flag after a delay
            resizeTimeout.current = setTimeout(() => {
                isResizing.current = false;
                setIsDraggingEnabled(true);
            }, 500);
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        window.addEventListener('resize', handleResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
        };
    }, []);

    const handleDragEnd = (productId, info, initialX, initialY) => {
        if (!containerRef.current) return;
        if (isResizing.current) return;

        // Guard against zero coordinates
        if (info.point.x === 0 || info.point.y === 0) return;

        const { width, height } = dimensions;
        if (width <= 0 || height <= 0) return;

        // Use drag offset to calculate new position relative to the initial top-left
        // initialX/Y are the top-left coordinates (centeredX/Y)
        const newTopLeftX = initialX + info.offset.x;
        const newTopLeftY = initialY + info.offset.y;

        // Add back the centering offset (60px, 20px) to get the axis point
        // This matches the subtraction done during render: centeredX = x - 60
        const axisX = newTopLeftX + 60;
        const axisY = newTopLeftY + 20;

        // Clamp to container
        const clampedX = Math.max(0, Math.min(axisX, width));
        const clampedY = Math.max(0, Math.min(axisY, height));

        // Convert to percentage (0-100)
        const percentX = (clampedX / width) * 100;
        const percentY = 100 - ((clampedY / height) * 100);

        updateProductAxisValues(productId, {
            [activeXAxisId]: percentX,
            [activeYAxisId]: percentY
        });
    };

    if (!xAxis || !yAxis) return <div>Please select axes</div>;

    return (
        <div className="w-full h-[75vh] flex flex-col relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Top Label (Y Axis Max) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur z-10">
                {yAxis.label} - {yAxis.rightLabel}
            </div>

            {/* Bottom Label (Y Axis Min) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur z-10">
                {yAxis.label} - {yAxis.leftLabel}
            </div>

            {/* Left Label (X Axis Min) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur z-10 origin-center">
                {xAxis.label} - {xAxis.leftLabel}
            </div>

            {/* Right Label (X Axis Max) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur z-10 origin-center">
                {xAxis.label} - {xAxis.rightLabel}
            </div>

            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Center Lines */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-100"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-indigo-100"></div>

                {/* Quadrant Labels (Optional) */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-indigo-50/50 select-none">Q2</div>
                <div className="absolute top-1/4 left-3/4 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-indigo-50/50 select-none">Q1</div>
                <div className="absolute top-3/4 left-1/4 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-indigo-50/50 select-none">Q3</div>
                <div className="absolute top-3/4 left-3/4 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-indigo-50/50 select-none">Q4</div>
            </div>

            {/* Chart Area */}
            <div ref={containerRef} className="flex-1 relative m-12 border border-slate-100 rounded-lg bg-slate-50/30">
                {dimensions.width > 0 && dimensions.height > 0 && products.map(product => {
                    // Default to 50 if axis value not set
                    const valX = product.axisValues[activeXAxisId] ?? 50;
                    const valY = product.axisValues[activeYAxisId] ?? 50;

                    // Convert to pixels
                    // X: 0% -> 0px, 100% -> width
                    // Y: 0% -> height, 100% -> 0px
                    const x = (valX / 100) * dimensions.width;
                    const y = dimensions.height - ((valY / 100) * dimensions.height);

                    // Center the card on the point (approximate, card width is dynamic)
                    // We'll let the card handle its own centering offset visually or just pin top-left
                    // Better to pin center. transform: translate(-50%, -50%)
                    // But Framer Motion x/y are absolute.
                    // We can use style={{ transform: 'translate(-50%, -50%)' }} on the card inner?
                    // Or subtract half width/height here? We don't know width/height.
                    // Let's subtract a fixed amount (e.g. 60px width, 20px height) or just let it be top-left anchored for now.
                    // Actually, `ProductCard` has `x` and `y` props.
                    // Let's adjust x/y to be centered.
                    const centeredX = x - 60; // Approx half width
                    const centeredY = y - 20; // Approx half height

                    return (
                        <ProductCard
                            key={product.id}
                            product={product}
                            x={centeredX}
                            y={centeredY}
                            containerRef={containerRef}
                            onDragEnd={(e, info) => handleDragEnd(product.id, info, centeredX, centeredY)}
                            isDraggingEnabled={isDraggingEnabled}
                        />
                    );
                })}
            </div>
        </div>
    );
}
