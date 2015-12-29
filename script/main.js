/**
 * Handles all functionality. Single file to keep it as simple to read as posisble.
 * You will want to use something like webpack and split functionality into
 * multiple files
 * Using React and Redux would also simplify state management and data flow
 *
 * @module main.js
 */

(function app () {
    /**
     *
     * App-Wide drag state
     *
     */
    // keeps track of the currently selected color that is being dragged
    // calling setData and getData on the dataTransfer api is a little janky,
    // so store state here
    var SELECTED_COLOR = null;
    // this will be populated with the grid color state
    var MOSAIC_GRID_STATE = [];
    window.MOSAIC_GRID_STATE = MOSAIC_GRID_STATE;

    /**
     *
     * Utilities for persisting state in URL
     *
     */
    function setUrlState (gridState) {
        // super ugly, just stringify the array and set the state
        window.location.hash = JSON.stringify(gridState);
    }

    function getMosaicGridFromUrl () {
        var hash = ('' + window.location.hash).replace(/^#/, '');

        if (hash && hash.length > 2) {
            try { MOSAIC_GRID_STATE = JSON.parse(hash); }
            catch (err) { console.error('getMosaicGridFromUrl', 'error parsing hash: ' + err); }
        }
    }

    function clearMosaicState () {
        window.location.hash = '';
        if (MOSAIC_GRID_STATE) {
            for (var y = 0; y < MOSAIC_GRID_STATE.length; y++) {
                for (var x = 0; x < MOSAIC_GRID_STATE[y].length; x++) {
                    MOSAIC_GRID_STATE[x][y] = null;
                }
            }
        }

        $('.mosaic__grid-cell').css({
            // TODO: store default grid CSS somewhere, or just use react to handle
            // all CSS
            border: '1px solid #cdcdcd',
            background: '#ffffff'
        });
    }

    /**
     *
     * renders all palette items
     *
     */
    function setupPaletteSquares () {
        var $paletteFragment = $(document.createDocumentFragment());

        var colors = [
            '#ffffff',
            '#a6cee3',
            '#1f78b4',
            '#62976e',
            '#b2df8a',
            '#33a02c',
            '#fb9a99',
            '#e31a1c',
            '#fdbf6f',
            '#ff7f00',
            '#cab2d6',
            '#336699',
            '#cd94b1',
            '#806959',
            '#343434'
        ];

        colors.forEach(function (color) {
            $paletteFragment.append($('<div class="palette-item"></div>')
                .css({background: color})
                .attr({draggable: true })
                // Drag handlers
                .on('dragstart', function onDragStart (event) {
                    console.log('palette:dragStart', 'drag started, color: ' + color);
                    SELECTED_COLOR = color;
                })
            );
        });

        $('#palette').append($paletteFragment);
    }

    /**
     * utility for setting a cell's color. Used when drop handler is called,
     * and can be used when clicking on a cell
     */
    function setCellColor ($el, x, y, color) {
        // Get the id of drag source element (that was added to the drag data
        // payload by the dragstart event handler)
        $el.css({
            background: color,
            border: '1px solid ' + color
        });

        // update mosaic state
        MOSAIC_GRID_STATE[x][y] = color;

        // update URL
        setUrlState(MOSAIC_GRID_STATE);
    }

    /**
     *
     * Sets up mosaic grid. Draws the initial grid and sets up drag events
     *
     */
    function setupMosiac () {
        // specify dimensions, x by y
        var gridDimensions = [8, 8];
        var $gridFragment = $(document.createDocumentFragment());
        var $gridRowFragment;
        var $gridCellFragment;

        var $allMosaicCells;

        for (var y = 0; y < gridDimensions[1]; y++) {
            $gridRowFragment = $('<div class="mosaic__grid-row"></div>');

            for (var x = 0; x < gridDimensions[0]; x++) {
                (function xyClosure (x, y){
                    // get initial color state if it exists
                    var mosaicCellCss = {};
                    if (MOSAIC_GRID_STATE &&
                    MOSAIC_GRID_STATE[x] &&
                    MOSAIC_GRID_STATE[x][y]) {
                        // exists, set cell css
                        var mosaicCellCss = {
                            background: MOSAIC_GRID_STATE[x][y],
                            border: '1px solid ' + MOSAIC_GRID_STATE[x][y]
                        };

                    } else {
                        // does not exist, set initial state
                        MOSAIC_GRID_STATE[x] = MOSAIC_GRID_STATE[x] || [];
                        MOSAIC_GRID_STATE[x][y] = MOSAIC_GRID_STATE[x][y] || null;
                    }

                    $gridRowFragment.append(
                        $('<div class="mosaic__grid-cell mosaic__grid-cell--' + x + '-' + y + '"></div>')
                        .css(mosaicCellCss)
                        /**
                         * Drag
                         */
                        .on('dragover', function onDragOver (event) {
                            // When the palette cell is over a grid cell, change
                            // the grid cell's color
                            event.preventDefault();

                            // if a color hasn't been selected from the palette,
                            // we're done
                            if (!SELECTED_COLOR) { return false; }

                            // lazily select all grid cells
                            $allMosaicCells = $allMosaicCells || $('.mosaic__grid-cell');

                            // remove existing hover style
                            $allMosaicCells.css({ 'border-style': 'solid' });

                            //$(event.currentTarget).css({ background: '1px solid ' + SELECTED_COLOR });
                            $(event.currentTarget).css({ 'border-style': 'dashed' });
                        })
                        .on('drop', function dropHandler (event) {
                            event.preventDefault();
                            console.log('gridCell:dropHandler', 'dropped', event);

                            // set cell color
                            setCellColor($(event.currentTarget), x, y, SELECTED_COLOR);

                            // clear out currently selected color
                            SELECTED_COLOR = null;
                        })
                        .on('mouseenter', function mouseenter (event) {
                            console.log('gridCell:mouseenter', 'entered cell: ' + [x, y]);
                        })
                        .on('mouseleave', function mouseleave (event) {
                            console.log('gridCell:mouseleave', 'left cell: ' + [x, y]);
                        })
                        .on('click', function clicked (event) {
                        })
                    );
                    $gridFragment.append($gridRowFragment);
                })(y, x);
            }
        }

        $('#mosaic').append($gridFragment);
    } // done setting up mosaic grid

    /**
     *
     * Clear button
     *
     */
    $('#button__clear').on('click', function () {
        var confirmed = window.confirm('Are you sure you want to erase your mosiac?');
        if (confirmed) { clearMosaicState(); }
    });

    /**
     *
     * Start it up
     *
     */
    function init () {
        // get initial state if it exists
        getMosaicGridFromUrl();

        // draw all palette items
        setupPaletteSquares();
        setupMosiac();
    }
    init();

})();
