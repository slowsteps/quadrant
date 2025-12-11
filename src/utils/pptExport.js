import PptxGenJS from 'pptxgenjs';

// Map Tailwind background classes to Hex colors (approximate)
const COLOR_MAP = {
    'bg-white': 'FFFFFF',
    'bg-red-50': 'FEF2F2',
    'bg-orange-50': 'FFF7ED',
    'bg-amber-50': 'FFFBEB',
    'bg-yellow-50': 'FEFCE8',
    'bg-lime-50': 'F7FEE7',
    'bg-green-50': 'F0FDF4',
    'bg-emerald-50': 'ECFDF5',
    'bg-teal-50': 'F0FDFA',
    'bg-cyan-50': 'ECFEFF',
    'bg-sky-50': 'F0F9FF',
    'bg-blue-50': 'EFF6FF',
    'bg-indigo-50': 'EEF2FF',
    'bg-violet-50': 'F5F3FF',
    'bg-purple-50': 'FAF5FF',
    'bg-fuchsia-50': 'FDF4FF',
    'bg-pink-50': 'FDF2F8',
    'bg-rose-50': 'FFF1F2',
    'bg-slate-50': 'F8FAFC',
};

const CARD_WIDTH = 1.5; // inches
const CARD_HEIGHT = 0.8; // inches
// Widescreen chart dimensions (approx 16:9 ratio compatible space)
const CHART_WIDTH = 8.5;
const CHART_HEIGHT = 4.5;
const CHART_X = (10 - CHART_WIDTH) / 2; // Center X
const CHART_Y = (5.625 - CHART_HEIGHT) / 2 + 0.1; // Center Y

// Helper: Convert URL to Base64 using proxy
const convertImageToBase64 = async (url) => {
    if (!url) return null;
    try {
        // Use local proxy to bypass CORS and validate favicon
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);

        // Proxy returns 404 if it's the default globe
        if (!response.ok) return null; // Return null to trigger fallback

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Failed to convert image to base64:', url, error);
        return null; // Graceful fallback
    }
};


export const generatePPT = async ({ pages, axes, products, fileName }) => {
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';

    // 2. Page Slides
    for (const page of pages) {
        const slide = pres.addSlide();
        const xAxis = axes.find(a => a.id === page.xAxisId);
        const yAxis = axes.find(a => a.id === page.yAxisId);

        // Slide Title
        slide.addText(`${page.title}`, {
            x: 0.5, y: 0.2, w: 9, h: 0.4,
            fontSize: 18, bold: true, color: '333333'
        });

        // --- Draw Axes ---
        // Center lines
        const midX = CHART_X + CHART_WIDTH / 2;
        const midY = CHART_Y + CHART_HEIGHT / 2;

        // X Axis Line (Horizontal)
        slide.addShape(pres.ShapeType.line, {
            x: CHART_X, y: midY, w: CHART_WIDTH, h: 0,
            line: { color: 'D1D5DB', width: 2 } // slate-300
        });

        // Y Axis Line (Vertical)
        slide.addShape(pres.ShapeType.line, {
            x: midX, y: CHART_Y, w: 0, h: CHART_HEIGHT,
            line: { color: 'D1D5DB', width: 2 }
        });

        // Outline Border (Transparent fill)
        slide.addShape(pres.ShapeType.rect, {
            x: CHART_X, y: CHART_Y, w: CHART_WIDTH, h: CHART_HEIGHT,
            line: { color: 'E5E7EB', width: 1 } // slate-200, no fill
        });

        // --- Labels ---
        const labelStyle = {
            fontSize: 10, bold: true, color: '64748B', // slate-500
            fill: { color: 'FFFFFF' },
            align: 'center'
        };
        const padding = 0.1;
        // Helper to estimate width based on char count (font size 10 approx 0.07-0.08 inch/char)
        const getLabelWidth = (text) => (text.length * 0.08) + 0.2;

        if (xAxis) {
            // X Left (Min) - Inside Left
            const leftText = `${xAxis.label} - ${xAxis.leftLabel}`;
            const leftW = getLabelWidth(leftText);
            slide.addText(leftText, {
                ...labelStyle,
                x: CHART_X + padding, y: midY - 0.25, w: leftW, h: 0.5,
                align: 'left' // Text alignment inside box
            });

            // X Right (Max) - Inside Right
            const rightText = `${xAxis.label} - ${xAxis.rightLabel}`;
            const rightW = getLabelWidth(rightText);
            slide.addText(rightText, {
                ...labelStyle,
                x: CHART_X + CHART_WIDTH - rightW - padding, y: midY - 0.25, w: rightW, h: 0.5,
                align: 'right'
            });
        }

        if (yAxis) {
            // Y Top (Max) - Inside Top
            const topText = `${yAxis.label} - ${yAxis.rightLabel}`;
            const topW = getLabelWidth(topText);
            slide.addText(topText, {
                ...labelStyle,
                x: midX - (topW / 2), y: CHART_Y + padding, w: topW, h: 0.4
            });

            // Y Bottom (Min) - Inside Bottom
            const bottomText = `${yAxis.label} - ${yAxis.leftLabel}`;
            const bottomW = getLabelWidth(bottomText);
            slide.addText(bottomText, {
                ...labelStyle,
                x: midX - (bottomW / 2), y: CHART_Y + CHART_HEIGHT - 0.4 - padding, w: bottomW, h: 0.4
            });
        }


        // --- Draw Products ---
        // We need to fetch all images first to allow parallelism
        const pageProducts = products.map(p => {
            const xVal = p.axisValues?.[page.xAxisId] ?? 50;
            const yVal = p.axisValues?.[page.yAxisId] ?? 50;
            return {
                ...p,
                xVal,
                yVal,
            };
        });

        // Process images
        const productPromises = pageProducts.map(async (p) => {
            let base64Img = null;
            if (p.logoUrl) {
                base64Img = await convertImageToBase64(p.logoUrl);
            }
            return { ...p, base64Img };
        });

        const productsWithImages = await Promise.all(productPromises);

        for (const p of productsWithImages) {
            // Coordinate Mapping:
            // 0% -> CHART_X
            // 100% -> CHART_X + CHART_SIZE
            // However, Cartesian Top is 100, Bottom is 0?
            // Usually Quadrants:
            // X: Left (0) -> Right (100)
            // Y: Bottom (0) -> Top (100)
            // Screen Coords: Top is 0.
            // So Y = 100 means Top of chart (CHART_Y)
            // Y = 0 means Bottom of chart (CHART_Y + CHART_SIZE)

            // Math:
            // px = (xVal / 100) * CHART_WIDTH + CHART_X
            // py = (1 - (yVal / 100)) * CHART_HEIGHT + CHART_Y  <-- Flip Y

            // Center the card on the point
            const cx = (p.xVal / 100) * CHART_WIDTH + CHART_X;
            const cy = (1 - (p.yVal / 100)) * CHART_HEIGHT + CHART_Y;

            const boxX = cx - (CARD_WIDTH / 2);
            const boxY = cy - (CARD_HEIGHT / 2);

            // Extract background color hex
            const twBgClass = p.color?.split(' ').find(c => c.startsWith('bg-')) || 'bg-white';
            const fillColor = COLOR_MAP[twBgClass] || 'FFFFFF';

            // Rounded Rectangle Container
            slide.addShape(pres.ShapeType.roundRect, {
                x: boxX, y: boxY, w: CARD_WIDTH, h: CARD_HEIGHT,
                fill: { color: fillColor },
                line: { color: 'E2E8F0', width: 1 }, // slate-200
                rectRadius: 0.15
            });

            // Logo Image
            const ICON_SIZE = 0.3;
            if (p.base64Img) {
                slide.addImage({
                    data: p.base64Img,
                    x: boxX + (CARD_WIDTH - ICON_SIZE) / 2, // Center horizontally
                    y: boxY + 0.1,
                    w: ICON_SIZE, h: ICON_SIZE,
                    sizing: { type: 'contain' }
                });
            } else {
                // Fallback Icon (Gray Circle with Initial)
                const circleX = boxX + (CARD_WIDTH - ICON_SIZE) / 2;
                const circleY = boxY + 0.1;

                slide.addShape(pres.ShapeType.ellipse, {
                    x: circleX, y: circleY, w: ICON_SIZE, h: ICON_SIZE,
                    fill: { color: 'F1F5F9' }, // slate-100
                    line: { color: 'CBD5E1', width: 1 } // slate-300
                });

                // Initial
                slide.addText(p.name ? p.name.charAt(0).toUpperCase() : '?', {
                    x: circleX, y: circleY, w: ICON_SIZE, h: ICON_SIZE,
                    align: 'center', fontSize: 10, bold: true, color: '64748B' // slate-500
                });
            }

            // Name
            slide.addText(p.name, {
                x: boxX, y: boxY + 0.45, w: CARD_WIDTH, h: 0.3,
                align: 'center', fontSize: 8, bold: true, color: '334155' // slate-700
            });
        }
    }

    // Save
    pres.writeFile({ fileName: `${fileName || 'Project'}.pptx` });
};
