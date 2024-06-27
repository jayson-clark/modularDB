import { useEffect, useState } from 'react';

/**
 * Header Component
 * 
 * This component fetches the layout from the server and renders widgets dynamically
 * based on the layout configuration.
 */
const WidgetGrid = () => {
    const [layout, setLayout] = useState([]);

    /**
     * Fetch the layout configuration from the server when the component mounts.
     * 
     * The layout configuration contains information about the position and size of
     * each widget to be displayed in the grid.
     */
    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/layoutManager/loadLayout');
                const layoutData = await response.json();
                setLayout(layoutData);
            } catch (err) {
                console.error('Error loading layout:', err);
            }
        };

        fetchLayout();
    }, []);

    return <section>
        {layout.map((widget, index) => <div
            className="grid-item"
            style={{
                gridColumn: `${widget.x} / span ${widget.width}`,
                gridRow: `${widget.y} / span ${widget.height}`
            }}
        >
            <iframe
                src={`http://localhost:3000/widgets/${widget.plugin_id}/${widget.widget_id}`}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            ></iframe>
        </div>
        )}
    </section>;

};

export default WidgetGrid;
