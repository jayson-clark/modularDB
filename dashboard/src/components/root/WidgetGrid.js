import { useEffect, useState } from 'react';

/**
 * WidgetGrid Component
 * 
 * This component fetches the layout from the server and renders widgets dynamically
 * based on the layout configuration. The API URL is configurable and stored in
 * local storage for persistence.
 */
const WidgetGrid = () => {
    const [layout, setLayout] = useState([]);
    const [API_URL, setAPIUrl] = useState(localStorage.getItem('api_url'));
    const [TOKEN, setToken] = useState(localStorage.getItem('auth_token'));

    /**
     * Prompts the user to enter the backend API URL and stores it in local storage.
     * 
     * If a URL is provided, it sets the API_URL state with the new URL.
     */
    const apiPrompt = () => {
        const url = prompt("Enter backend URL:", "http://localhost:3000");
        if (url) {
            localStorage.setItem('api_url', url);
            setAPIUrl(url);
        }
    };

    /**
     * Prompts the user for a password and requests an authentication token.
     */
    const requestToken = async () => {
        const password = prompt("Enter password:");
        if (password) {
            try {
                const response = await fetch(`${API_URL}/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password }),
                });

                if (response.ok) {
                    const { token } = await response.json();
                    localStorage.setItem('auth_token', token);
                    setToken(token);
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error}`);
                    requestToken();
                }
            } catch (err) {
                console.error('Error requesting token:', err);
                alert('Failed to get token. Please try again.');
                requestToken();
            }
        }
    };

    /**
     * Fetch the layout configuration from the server when the component mounts.
     * 
     * The layout configuration contains information about the position and size of
     * each widget to be displayed in the grid.
     */
    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const response = await fetch(`${API_URL}/api/layoutManager/loadLayout`, {
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                    },
                });

                if (response.status === 403) {
                    requestToken();
                } else {
                    const layoutData = await response.json();
                    setLayout(layoutData);
                }
            } catch (err) {
                console.error('Error loading layout:', err);
                apiPrompt();
            }
        };

        if (TOKEN) {
            fetchLayout();
        } else {
            requestToken();
        }
    }, [API_URL, TOKEN]);

    return <section>
        {layout.map((widget, index) => (
            <div
                key={index}
                className="grid-item"
                style={{
                    gridColumn: `${widget.x} / span ${widget.width}`,
                    gridRow: `${widget.y} / span ${widget.height}`
                }}
            >
                <iframe
                    src={`${API_URL}/widgets/${widget.plugin_id}/${widget.widget_id}?token=${TOKEN}`}
                    sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                ></iframe>
            </div>
        ))}
    </section>;
};

export default WidgetGrid;
