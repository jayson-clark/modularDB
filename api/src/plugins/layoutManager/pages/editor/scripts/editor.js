/**
 * LayoutEditor class manages the layout of widgets within a grid.
 */
class LayoutEditor {
    static GRID_COLUMNS = 24;
    static GRID_ROWS = 12;
    static MIN_ZOOM = 0.3;
    static MAX_ZOOM = 3.0;
    static ZOOM_STEP = 0.04;
    static RESIZE_THRESHOLD = 10;

    /**
     * Constructor for the LayoutEditor class.
     * @param {HTMLElement} widgetSelector - The configuration sidebar element.
     * @param {HTMLElement} viewportElement - The viewport element where the grid will be displayed.
     */
    constructor(widgetSelector, viewportElement) {
        this.widgetSelector = widgetSelector;
        this.viewportElement = viewportElement;

        this.gridElement = document.createElement('div');
        this.gridElement.className = 'grid';
        this.viewportElement.appendChild(this.gridElement);

        this.viewportState = {
            lastX: 0,
            lastY: 0,
            isDragging: false,
            zoom: 0.5,
        };

        this.gridElement.style.transform = `scale(${this.viewportState.zoom})`;

        this.gridState = {
            isDraggingWidget: false,
            isResizingWidget: false,
            widgetBeingDragged: null,
            widgetBeingResized: null,
            resizeDirection: null,
            startDragWidgetX: 0,
            startDragWidgetY: 0,
            removedWidget: null,
            removedWidgetSrcSet: false,
            removedWidgetRect: null,
        };

        this._bindMethods();
        this._addEventListeners();
        this._populateWidgetSelector();
    }

    /**
     * Binds class methods to the instance.
     */
    _bindMethods() {
        this._handleViewportMouseDown = this._handleViewportMouseDown.bind(this);
        this._handleViewportWheel = this._handleViewportWheel.bind(this);
        this._handleDocumentMouseMove = this._handleDocumentMouseMove.bind(this);
        this._handleDocumentMouseUp = this._handleDocumentMouseUp.bind(this);
        this._handleGridMouseMove = this._handleGridMouseMove.bind(this);
        this._handleGridMouseDown = this._handleGridMouseDown.bind(this);
        this._handleGridMouseUp = this._handleGridMouseUp.bind(this);
    }

    /**
     * Adds event listeners to the necessary elements.
     */
    _addEventListeners() {
        this.viewportElement.addEventListener('mousedown', this._handleViewportMouseDown);
        this.viewportElement.addEventListener('wheel', this._handleViewportWheel);
        document.addEventListener('mousemove', this._handleDocumentMouseMove);
        document.addEventListener('mouseup', this._handleDocumentMouseUp);
        document.addEventListener('mousemove', this._handleGridMouseMove);
        this.gridElement.addEventListener('mousedown', this._handleGridMouseDown);
        document.addEventListener('mouseup', this._handleGridMouseUp);
    }

    /**
     * Populates the widget selector with available widgets from plugins.
     */
    async _populateWidgetSelector() {
        try {
            const response = await fetch('/api/pluginManager/list', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            const plugins = await response.json();

            for (const plugin_id of plugins) {
                const widgetResponse = await fetch(`/api/pluginManager/widgets/${plugin_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                const widgets = await widgetResponse.json();

                if (widgets.length > 0) {
                    this.widgetSelector.innerHTML += `<h2>${plugin_id}</h2>`;
                    for (const widget of widgets) {
                        this.widgetSelector.innerHTML += `
                            <div onclick="layoutEditor.addWidget('${plugin_id}', '${widget.path.split(plugin_id + '/')[1]}')">
                                <iframe src="${widget.path}?token=${token}"></iframe>
                            </div>
                        `;
                    }
                }
            }
        } catch (err) {
            console.error('Error populating widget selector:', err);
        }
    }

    /**
     * Saves the current layout to the server.
     */
    async _saveLayout() {
        const widgetElements = Array.from(this.gridElement.querySelectorAll('.grid-item'));
        const layoutData = widgetElements.map(el => {
            const [y, x, height, width] = el.style.gridArea.replaceAll('span ', '').split(' / ').map(num => parseInt(num));
            const [plugin_id, widget_id] = el.querySelector('iframe').src.split('/widgets/')[1].split('?token')[0].split('/');
            return { x, y, height, width, widget_id, plugin_id };
        });

        await fetch('/api/layoutManager/saveLayout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(layoutData),
        });
    }

    /**
     * Gets the grid position based on mouse coordinates.
     * @param {number} mouseX - The X coordinate of the mouse.
     * @param {number} mouseY - The Y coordinate of the mouse.
     * @returns {Array<number>} - The X and Y grid positions.
     */
    _getGridPosition(mouseX, mouseY) {
        const rect = this.gridElement.getBoundingClientRect();
        let clientX = mouseX - rect.left;
        let clientY = mouseY - rect.top;

        const pixelsPerGridX = rect.width / LayoutEditor.GRID_COLUMNS;
        const pixelsPerGridY = rect.height / LayoutEditor.GRID_ROWS;

        let x = Math.floor(clientX / pixelsPerGridX) + 1;
        let y = Math.floor(clientY / pixelsPerGridY) + 1;

        return [x, y];
    }

    /**
     * Determines the direction of resizing based on mouse position.
     * @param {HTMLElement} widget - The widget element being resized.
     * @param {number} mouseX - The X coordinate of the mouse.
     * @param {number} mouseY - The Y coordinate of the mouse.
     * @returns {string} - The resize direction.
     */
    _getResizeDirection(widget, mouseX, mouseY) {
        const rect = widget.getBoundingClientRect();
        let direction = '';
        if (mouseY < rect.top + LayoutEditor.RESIZE_THRESHOLD) direction += 'n';
        if (mouseY > rect.bottom - LayoutEditor.RESIZE_THRESHOLD) direction += 's';
        if (mouseX < rect.left + LayoutEditor.RESIZE_THRESHOLD) direction += 'w';
        if (mouseX > rect.right - LayoutEditor.RESIZE_THRESHOLD) direction += 'e';
        return direction;
    }

    /**
     * Handles mousedown event on the grid.
     * @param {MouseEvent} event - The mousedown event.
     */
    _handleGridMouseDown(event) {
        const [x, y] = this._getGridPosition(event.clientX, event.clientY);
        const widget = this._getWidgetAtPosition(x, y);

        if (widget !== null) {
            event.stopPropagation();
            const target = document.querySelector(`.grid-item[data-grid-area='${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}']`);
            const direction = this._getResizeDirection(target, event.clientX, event.clientY);

            if (direction) {
                this.gridState.isResizingWidget = true;
                this.gridState.widgetBeingResized = widget;
                this.gridState.resizeDirection = direction;
            } else {
                this.gridState.isDraggingWidget = true;
                this.gridState.widgetBeingDragged = widget;
                this.gridState.startDragWidgetX = x - widget.x;
                this.gridState.startDragWidgetY = y - widget.y;

                document.querySelector('.outer-circle').style.transform = 'scale(1)';
            }
        }
    }

    /**
     * Handles mouseup event on the grid.
     * @param {MouseEvent} event - The mouseup event.
     */
    _handleGridMouseUp(event) {
        if (this.gridState.isDraggingWidget || this.gridState.isResizingWidget) {
            const widget = this.gridState.isDraggingWidget ? this.gridState.widgetBeingDragged : this.gridState.widgetBeingResized;

            if (widget) {
                this.gridState.isDraggingWidget = false;
                this.gridState.isResizingWidget = false;
                this.gridState.widgetBeingDragged = null;
                this.gridState.widgetBeingResized = null;
                this.gridState.resizeDirection = null;
                this.gridState.removedWidgetSrcSet = false;
                this.gridState.removedWidgetRect = null;

                if (this.gridState.removedWidget) {
                    this.gridState.removedWidget = null;
                    let rect = document.querySelector('.outer-circle').getBoundingClientRect();
                    document.querySelector('#dummywidget').style.transition = 'all 1.5s ease-in';
                    document.querySelector('#dummywidget').style.transform = `translate(${rect.left + (rect.width / 2)}px, ${rect.top + (rect.height / 2)}px) scale(0)`;

                    document.querySelector('.outer-circle').style.transitionDelay = '1.5s';

                    this._removeWidget(widget);

                    setTimeout(() => {
                        document.querySelector('.outer-circle').style.transitionDelay = '0s';
                    }, 1500);
                }

                document.querySelector('.outer-circle').style.transform = 'scale(0)';

                this._saveLayout();
            }
        }
    }

    /**
     * Handles mousemove event on the grid.
     * @param {MouseEvent} event - The mousemove event.
     */
    _handleGridMouseMove(event) {
        if (this.gridState.isResizingWidget) {
            this._resizeWidget(event);
        } else if (this.gridState.isDraggingWidget) {
            this._dragWidget(event);
        } else {
            this._updateCursor(event);
        }
    }

    /**
     * Resizes a widget based on the mouse position.
     * @param {MouseEvent} event - The mousemove event.
     */
    _resizeWidget(event) {
        event.stopPropagation();
        const widget = this.gridState.widgetBeingResized;
        const direction = this.gridState.resizeDirection;
        const [x, y] = this._getGridPosition(event.clientX, event.clientY);

        const newDimensions = this._calculateNewDimensions(widget, x, y, direction);

        if (this._isValidResize(widget, newDimensions)) {
            this._applyResize(widget, newDimensions);
        }
    }

    /**
     * Calculates new dimensions for a widget during resizing.
     * @param {Object} widget - The widget being resized.
     * @param {number} x - The new X position.
     * @param {number} y - The new Y position.
     * @param {string} direction - The direction of resizing.
     * @returns {Object} - The new dimensions.
     */
    _calculateNewDimensions(widget, x, y, direction) {
        let width = widget.width;
        let height = widget.height;
        let wx = widget.x;
        let wy = widget.y;

        if (direction.includes('e')) width = x - wx + 1;
        if (direction.includes('s')) height = y - wy + 1;
        if (direction.includes('w')) {
            const deltaX = wx - x;
            wx = x;
            width += deltaX;
        }
        if (direction.includes('n')) {
            const deltaY = wy - y;
            wy = y;
            height += deltaY;
        }

        width = Math.max(1, width);
        height = Math.max(1, height);
        if (wx + width > LayoutEditor.GRID_COLUMNS + 1) width -= 1;
        if (wy + height > LayoutEditor.GRID_ROWS + 1) height -= 1;

        if (wy > widget.y && widget.height == 1) wy = widget.y;
        if (wx > widget.x && widget.width == 1) wx = widget.x;

        return { wx, wy, width, height };
    }

    /**
     * Checks if the resizing of a widget is valid.
     * @param {Object} widget - The widget being resized.
     * @param {Object} newDimensions - The new dimensions.
     * @returns {boolean} - True if valid, false otherwise.
     */
    _isValidResize(widget, newDimensions) {
        const { wx, wy, width, height } = newDimensions;

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const testLoc = this._getWidgetAtPosition(wx + i, wy + j);
                if (testLoc && !this._isSameWidget(testLoc, widget)) return false;
            }
        }
        return true;
    }

    _isSameWidget(widget1, widget2) {
        return widget1.widget_id === widget2.widget_id &&
            widget1.plugin_id === widget2.plugin_id &&
            widget1.x === widget2.x &&
            widget1.y === widget2.y &&
            widget1.width === widget2.width &&
            widget1.height === widget2.height;
    }

    /**
     * Applies the new dimensions to the widget.
     * @param {Object} widget - The widget being resized.
     * @param {Object} newDimensions - The new dimensions.
     */
    _applyResize(widget, newDimensions) {
        const { wx, wy, width, height } = newDimensions;

        const gridAreaSearch = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
        const target = document.querySelector(`.grid-item[data-grid-area='${gridAreaSearch}']`);

        if (!target) return;

        widget.width = width;
        widget.height = height;
        widget.x = wx;
        widget.y = wy;

        const gridAreaValue = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
        target.style.gridArea = gridAreaValue;
        target.setAttribute('data-grid-area', gridAreaValue);

        this.gridState.widgetBeingResized = widget;
    }

    /**
     * Drags a widget based on the mouse position.
     * @param {MouseEvent} event - The mousemove event.
     */
    _dragWidget(event) {
        event.stopPropagation();

        const [x, y] = this._getGridPosition(event.clientX, event.clientY);
        const widget = this.gridState.widgetBeingDragged;

        const gridAreaSearch = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
        const target = document.querySelector(`.grid-item[data-grid-area='${gridAreaSearch}']`);

        if (target && !this.gridState.removedWidgetRect) {
            this.gridState.removedWidgetRect = target.getBoundingClientRect();
            this.gridState.removedWidgetSrc = target.querySelector('iframe').src;
        }

        const dummyWidget = document.querySelector('#dummywidget');
        if (!this.gridState.removedWidgetSrcSet && dummyWidget) {
            dummyWidget.src = this.gridState.removedWidgetSrc;
            this.gridState.removedWidgetSrcSet = true;
        }

        if (x > LayoutEditor.GRID_COLUMNS || y > LayoutEditor.GRID_ROWS || x < 1 || y < 1) {
            const outerCircle = document.querySelector('.outer-circle');

            const gridScale = parseFloat(this.gridElement.style.transform.split('(')[1].split(')')[0]);

            if (outerCircle) outerCircle.style.transform = 'scale(1)';
            if (dummyWidget) {
                dummyWidget.style.width = `${this.gridState.removedWidgetRect.width * (1 / gridScale)}px`;
                dummyWidget.style.height = `${this.gridState.removedWidgetRect.height * (1 / gridScale)}px`;

                dummyWidget.style.transition = '';
                dummyWidget.style.display = 'block';
                dummyWidget.style.transform = `translate(${event.clientX - (this.gridState.removedWidgetRect.width / 2)}px, ${event.clientY - (this.gridState.removedWidgetRect.height / 2)}px) scale(${gridScale})`;
            }

            if (!this.gridState.removedWidget) this._removeWidget(widget);
            this.gridState.removedWidget = widget;

            return;
        }

        let newPosX = x - this.gridState.startDragWidgetX;
        let newPosY = y - this.gridState.startDragWidgetY;

        newPosX = Math.max(1, Math.min(newPosX, LayoutEditor.GRID_COLUMNS + 1 - widget.width));
        newPosY = Math.max(1, Math.min(newPosY, LayoutEditor.GRID_ROWS + 1 - widget.height));

        if (
            (this._isValidDrag(widget, newPosX, newPosY) ||
                this._isValidDrag(widget, widget.x, newPosY) ||
                this._isValidDrag(widget, newPosX, widget.y)) &&
            this.gridState.removedWidget
        ) {
            const dummyWidget = document.querySelector('#dummywidget');
            dummyWidget.style.display = 'none';

            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';

            const gridAreaValue = `${newPosY} / ${newPosX} / span ${widget.height} / span ${widget.width}`;
            gridItem.style.gridArea = gridAreaValue;
            gridItem.setAttribute('data-grid-area', gridAreaValue);

            const iframe = document.createElement('iframe');
            iframe.src = `/widgets/${widget.plugin_id}/${widget.widget_id}?token=${token}`;
            iframe.sandbox = 'allow-scripts allow-modals allow-same-origin';

            gridItem.appendChild(iframe);
            this.gridElement.appendChild(gridItem);

            this.gridState.removedWidget = null;
            this.gridState.isDraggingWidget = true;
            this.gridState.widgetBeingDragged = this._getWidgetAtPosition(x, y);
        }


        if (this._isValidDrag(widget, newPosX, newPosY)) {
            this._applyDrag(widget, newPosX, newPosY);
        } else if (this._isValidDrag(widget, widget.x, newPosY)) {
            this._applyDrag(widget, widget.x, newPosY);
        } else if (this._isValidDrag(widget, newPosX, widget.y)) {
            this._applyDrag(widget, newPosX, widget.y);
        }
    }

    /**
     * Checks if the dragging of a widget is valid.
     * @param {Object} widget - The widget being dragged.
     * @param {number} newPosX - The new X position.
     * @param {number} newPosY - The new Y position.
     * @returns {boolean} - True if valid, false otherwise.
     */
    _isValidDrag(widget, newPosX, newPosY) {
        if (newPosX < 1 || newPosY < 1 || newPosX + widget.width > LayoutEditor.GRID_COLUMNS + 1 || newPosY + widget.height > LayoutEditor.GRID_ROWS + 1) return false;

        for (let i = 0; i < widget.width; i++) {
            for (let j = 0; j < widget.height; j++) {
                const testLoc = this._getWidgetAtPosition(newPosX + i, newPosY + j);
                if (testLoc && !this._isSameWidget(testLoc, widget)) return false;
            }
        }
        return true;
    }

    /**
     * Applies the new position to the widget.
     * @param {Object} widget - The widget being dragged.
     * @param {number} newPosX - The new X position.
     * @param {number} newPosY - The new Y position.
     */
    _applyDrag(widget, newPosX, newPosY) {
        const gridAreaSearch = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
        const target = document.querySelector(`.grid-item[data-grid-area='${gridAreaSearch}']`);

        if (!target) return;

        widget.x = newPosX;
        widget.y = newPosY;

        const gridAreaValue = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
        target.style.gridArea = gridAreaValue;
        target.setAttribute('data-grid-area', gridAreaValue);

        this.gridState.widgetBeingDragged = widget;
    }

    /**
     * Updates the cursor style based on the mouse position.
     * @param {MouseEvent} event - The mousemove event.
     */
    _updateCursor(event) {
        const target = event.target.closest('.grid-item');
        if (target) {
            const direction = this._getResizeDirection(target, event.clientX, event.clientY);
            const cursorMap = {
                'n': 'ns-resize',
                's': 'ns-resize',
                'w': 'ew-resize',
                'e': 'ew-resize',
                'nw': 'nwse-resize',
                'ne': 'nesw-resize',
                'sw': 'nesw-resize',
                'se': 'nwse-resize'
            };
            this.viewportElement.style.cursor = direction ? cursorMap[direction] : 'move';
        } else {
            this.viewportElement.style.cursor = 'grab';
        }
    }

    /**
     * Handles the mousedown event on the viewport.
     * @param {MouseEvent} event - The mousedown event.
     */
    _handleViewportMouseDown(event) {
        this.viewportState.isDragging = true;
        this.viewportState.lastX = event.clientX;
        this.viewportState.lastY = event.clientY;

        this.viewportElement.style.cursor = 'grabbing';
    }

    /**
     * Handles the mousemove event on the document.
     * @param {MouseEvent} event - The mousemove event.
     */
    _handleDocumentMouseMove(event) {
        if (this.viewportState.isDragging) {
            const currentX = event.clientX;
            const currentY = event.clientY;
            const dx = currentX - this.viewportState.lastX;
            const dy = currentY - this.viewportState.lastY;

            const style = window.getComputedStyle(this.gridElement);
            const topValue = parseInt(style.top, 10);
            const leftValue = parseInt(style.left, 10);

            this.gridElement.style.top = `${topValue + dy}px`;
            this.gridElement.style.left = `${leftValue + dx}px`;

            this.viewportState.lastX = currentX;
            this.viewportState.lastY = currentY;
        }
    }

    /**
     * Handles the mouseup event on the document.
     * @param {MouseEvent} event - The mouseup event.
     */
    _handleDocumentMouseUp(event) {
        if (this.viewportState.isDragging) {
            this.viewportState.isDragging = false;
            this.viewportElement.style.cursor = 'grab';
        }
    }

    /**
     * Handles the wheel event on the viewport to zoom in and out.
     * @param {WheelEvent} event - The wheel event.
     */
    _handleViewportWheel(event) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -LayoutEditor.ZOOM_STEP : LayoutEditor.ZOOM_STEP;
        this.viewportState.zoom += delta;
        this.viewportState.zoom = Math.min(Math.max(LayoutEditor.MIN_ZOOM, this.viewportState.zoom), LayoutEditor.MAX_ZOOM);
        this.gridElement.style.transform = `scale(${this.viewportState.zoom})`;
    }

    /**
     * Sets the dimensions of the layout grid.
     * @param {number} columns - Number of columns.
     * @param {number} rows - Number of rows.
     */
    async setLayoutDimensions(columns, rows) {
        this.gridElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.gridElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        await this._renderWidgets();
    }
    1
    /**
     * Renders the widgets in the layout.
     */
    async _renderWidgets() {
        try {
            const response = await fetch('/api/layoutManager/loadLayout', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                console.error('Unauthorized access');
            } else {
                const layoutData = await response.json();

                layoutData.forEach((widget, index) => {
                    const gridItem = document.createElement('div');
                    gridItem.setAttribute('key', index);
                    gridItem.className = 'grid-item';

                    const gridAreaValue = `${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}`;
                    gridItem.style.gridArea = gridAreaValue;
                    gridItem.setAttribute('data-grid-area', gridAreaValue);

                    const iframe = document.createElement('iframe');
                    iframe.src = `/widgets/${widget.plugin_id}/${widget.widget_id}?token=${token}`;
                    iframe.sandbox = 'allow-scripts';

                    gridItem.appendChild(iframe);
                    this.gridElement.appendChild(gridItem);
                });
            }
        } catch (err) {
            console.error('Error loading layout:', err);
        }
    }

    /**
     * Checks whether a specific grid space is filled and what it is filled by.
     * @param {number} x - The x-coordinate of the grid space.
     * @param {number} y - The y-coordinate of the grid space.
     * @returns {Object|null} - The widget occupying the space, or null if the space is empty.
     */
    _getWidgetAtPosition(x, y) {
        const widgetElements = Array.from(this.gridElement.querySelectorAll('.grid-item'));
        const layoutData = widgetElements.map(el => {
            const [y, x, height, width] = el.style.gridArea.replaceAll('span ', '').split(' / ').map(num => parseInt(num));
            const [plugin_id, widget_id] = el.querySelector('iframe').src.split('/widgets/')[1].split('?token')[0].split('/');
            return { x, y, height, width, widget_id, plugin_id };
        });

        let resultWidget = null;
        layoutData.forEach(widget => {
            for (let i = 0; i < widget.width; i++) {
                for (let j = 0; j < widget.height; j++) {
                    if (widget.x + i == x && widget.y + j == y) {
                        resultWidget = widget;
                        break;
                    }
                }
            }
        });

        return resultWidget;
    }

    /**
     * Adds a new widget to the grid.
     * @param {string} plugin_id - The ID of the plugin.
     * @param {string} widget_id - The ID of the widget.
     */
    addWidget(plugin_id, widget_id) {
        let x = 1, y = 1;
        while (this._getWidgetAtPosition(x, y)) {
            x++;
            if (x === LayoutEditor.GRID_COLUMNS + 1) {
                x = 1;
                y++;
            }
        }

        if (y > LayoutEditor.GRID_ROWS) return;

        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        const gridAreaValue = `${y} / ${x} / span 1 / span 1`;
        gridItem.style.gridArea = gridAreaValue;
        gridItem.setAttribute('data-grid-area', gridAreaValue);

        const iframe = document.createElement('iframe');
        iframe.src = `/widgets/${plugin_id}/${widget_id}?token=${token}`;
        iframe.sandbox = 'allow-scripts allow-modals allow-same-origin';

        gridItem.appendChild(iframe);
        this.gridElement.appendChild(gridItem);

        this._saveLayout();
    }

    /**
     * Removes a widget from the grid.
     * @param {Object} widget - The widget to be removed.
     */
    _removeWidget(widget) {
        const target = document.querySelector(`.grid-item[data-grid-area='${widget.y} / ${widget.x} / span ${widget.height} / span ${widget.width}']`);
        if (target) {
            target.remove();
        }

        this._saveLayout();
    }
}
