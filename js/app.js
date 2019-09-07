
const pieceStyles = {
    "empty": "",
    "pawn": "fas fa-chess-pawn",
    "knight": "fas fa-chess-knight",
    "rook": "fas fa-chess-rook",
    "bishop": "fas fa-chess-bishop",
    "queen": "fas fa-chess-queen",
    "king": "fas fa-chess-king",
}

const pieces = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook"
];

const availableStyles = [
    "default",
    "blue",
    "red"
];

// Toggle debug messages
var isDebug = false;

const maxRows = 8, maxColumns = 8;

var fromPosition = null,
    positions = [],
    currentPlayer = "white",
    gameover = false;

// Initialize the Chess game
$(document).ready(() => initialize());

/**
 * @summary Update the board theme
 * @param {string} boardSelector 
 * @param {string} theme desired theme name
 */
function changeTheme(boardSelector, theme) {
    $(boardSelector).removeClass(availableStyles.join(" ")).addClass(theme);
}

/**
 * @summary Initialize board
 * @description Creates elements within specified containers to render
 * the board and alert messages
 * @param {string} boardSelector jQuery selector for element to place board
 * @param {string} alertSelector jQuery selector for element to place alerts
 */
function initialize(boardSelector = "#board", alertSelector = "#second") {

    let $boardWrapper = $(boardSelector),
        $alertWrapper = $(alertSelector);

    if (!$boardWrapper) { 
        console.error("Board wrapper '" + boardSelector + "' was not found");
        return;
    }

    if (!$alertWrapper) {
        console.error("Alert wrapper '" + alertSelector + "' was not found");
        return;
    }

    // Add a container for alert messages
    $alertWrapper.append($("<div></div>").prop("id", "alerts"));

    // Create row element to contain columns
    let $markerRowTop = $("<div></div>"),
        $markerRowBottom = $("<div></div>");

    $markerRowTop.addClass("row marker-row marker-row-top");
    $markerRowBottom.addClass("row marker-row marker-row-bottom");

    let columnMarkers = [ "a", "b", "c", "d", "e", "f", "g", "h" ];
    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
        
        let $gridMarkerTop = $("<div></div>").text(columnMarkers[columnIndex]).addClass("marker");
        $gridMarkerBottom = $("<div></div>").text(columnMarkers[columnIndex]).addClass("marker");
        $markerRowTop.append($gridMarkerTop);
        $markerRowBottom.append($gridMarkerBottom);
    }

    $boardWrapper.append($markerRowTop);
    
    // Build rows for board
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    
        // Create row element to contain columns
        let $rowContainer = $("<div></div>");
        $rowContainer.addClass("row");

        let gridMarker = $("<div></div>").text(1 + rowIndex).addClass("marker");
        $rowContainer.append(gridMarker)

        let columns = [];
        // Build columns for board
        for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
            
            columns.push( { row: rowIndex, column: columnIndex, type: "empty", player: "none", moveCount: 0 });

            // Create new tile
            let tile = $("<div></div>");
            tile.prop("id", "R" + rowIndex + "C" + columnIndex);
            tile.addClass("tile");

            // Set the tile css; default to "dark"; 
            // Alternate "light" for odd row and even column or even row and odd column
            let tileClass = "dark";
            if ((rowIndex % 2 === 1 && columnIndex % 2 === 0) 
                || (rowIndex % 2 === 0 && columnIndex % 2 === 1)) {
                tileClass = "light";
            } 
            tile.addClass(tileClass);

            // Add tile event handlers
            $(tile).on("click", () => { movePiece(rowIndex, columnIndex); render(boardSelector); } );
            
            // Add tile to row
            $rowContainer.append(tile);
        }

        gridMarker = $("<div></div>").text(1 + rowIndex).addClass("marker marker-row");
        $rowContainer.append(gridMarker)

        positions[rowIndex] =  columns;

        // Add row to board container
        $boardWrapper.append($rowContainer);
    }

    // Append the bottom marker row
    $boardWrapper.append($markerRowBottom);
    

    // Initialize Trays
    let $themeSelector = $("<select></select>").prop("id", "theme_selector"),
        $whiteTray = $("<div></div>").prop("id", "white_tray").addClass("tray"),
        $blackTray = $("<div></div>").prop("id", "black_tray").addClass("tray");
    availableStyles.forEach(s => $themeSelector.append("<option value='" + s + "'>" + s + "</option>"));
    $themeSelector.on("change", function () { changeTheme(boardSelector, this.value); });
    
    $boardWrapper.before($themeSelector, $whiteTray).after($blackTray);

    initializePieces();
    render(boardSelector);
}

/**
 * @summary Begin or and a move based on location
  * @param {number} row 
 * @param {number} column 
 */
function movePiece(row, column) {

    $("#alerts").empty();

    // Start Move
    if (!fromPosition) {
    
        if (positions[row][column].type === "empty")  {

            showAlert("Nothing to move.", "warning");
            return;
        } 

        if (positions[row][column].player !== currentPlayer) {

            showAlert("It is not your turn.", "warning");
            return;
        } 

        showAlert("Where do you want to move your " + positions[row][column].type + "?");

        fromPosition = { r: row, c: column, p: positions[row][column] };
        $("#R" + row + "C" + column).addClass("selected");
        
    // Finish Move
    } else {

        if (fromPosition.r == row && fromPosition.c == column) {
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            fromPosition = null;
            return;
        }

        let nextPosition = { r: row, c: column, p: positions[row][column] };

        if (nextPosition.p.player === fromPosition.p.player) {
            showAlert(fromPosition.p.player + " has decided to change piece from '" + fromPosition.p.type + "' to '" + nextPosition.p.type + "'.", "debug");
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            $("#R" + nextPosition.r + "C" + nextPosition.c).addClass("selected");
            fromPosition = nextPosition;
            return;
        }

        // Verify Move
        if (validateMove(fromPosition, nextPosition)) {

            if (nextPosition.p.player != "none" && nextPosition.p.player != currentPlayer) {
                $("#" + currentPlayer + "_tray").append($("#R" + nextPosition.r + "C" + nextPosition.c).children());
                showAlert(currentPlayer + " took " + nextPosition.p.player + "'s " + nextPosition.p.type);
                if (nextPosition.p.type == "king") {
                    showAlert(currentPlayer + " has won the game!");
                    gameover = true;
                }
            }

            // Swap the positions for the piece
            positions[row][column] = positions[fromPosition.r][fromPosition.c];
            positions[row][column].moveCount++;
            positions[fromPosition.r][fromPosition.c] = { type: "empty", player: "none" };
         
            if (currentPlayer == "white" && nextPosition.r == (maxRows -1)) {
                showAlert("You should be able to get a piece back. This isn't working yet.");
            }

            // Reset and change the active player
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            fromPosition = null;
            currentPlayer = (currentPlayer === "white") ? "black" : "white";
        }
    }
}

/**
 * @summary Position pieces on the board
 * @param {string} boardSelector 
 */
function render(boardSelector) {

    $(boardSelector).removeClass("active-player-white active-player-black").addClass("active-player-" + currentPlayer);

    for (let r = 0; r < positions.length; r++) {
        for (let c = 0; c < positions[r].length; c++) {

            let p = positions[r][c];
            
            let icon = $("<i></i>").addClass(pieceStyles[p.type] + " player-" + p.player );
            $("#R" + r + "C" + c)
                .empty()
                .append(icon);
        }
    }

    if (!gameover) {
        showAlert("It is your turn " + currentPlayer);
    }
}

/**
 * @summary Build initial state of all pieces in play
 */
function initializePieces() {
    for (let i = 0; i < maxColumns; i++) {
        positions[0][i].player = "white";
        positions[0][i].type = pieces[i];

        positions[1][i].player = "white";
        positions[1][i].type = "pawn";
        
        positions[maxRows -2][i].player = "black";        
        positions[maxRows -2][i].type = "pawn";

        positions[maxRows -1][i].player = "black";
        positions[maxRows -1][i].type = pieces[i];
    }
}

/**
 * @summary Posts a message in the alerts container
 * @param {string} message Message to display 
 * @param {string} type determines styling and display; (info|warning|debug) default "info"
 */
function showAlert(message, type = "info") {

    if (type === "debug" && !isDebug) { return; }
    
    let $alert = $("<div></div>")
      .addClass("alert alert-" + type)
      .text(message);

    $("#alerts").append($alert);
}

/**
 * @summary Determine if move is valid or not
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if move is valid; otherwise, false
 */
function validateMove(fromPosition, toPosition) {

    let isValidMove = true;
    let warningMessage = "";
    let colorMultiplier = (currentPlayer === "white") ? 1 : -1;

    switch (fromPosition.p.type) {
        case "pawn":

            // isMoveForward()
            // && isMoveOfLimitedSpaces(fromPosition, toPosition, allowedRowChange)
            // && isMoveVertical()
            // && !collisionDetected();

            let allowedRowChange = (fromPosition.p.moveCount > 0) ? 1 : 2;
            
            let rowDiff = (toPosition.r - fromPosition.r) * colorMultiplier;
            if (rowDiff > allowedRowChange) {
                warningMessage = "Cannot change move forward more than " + allowedRowChange + " row.";
                isValidMove = false;
            } else if (toPosition.c != fromPosition.c) {
                // Allow for taking another player on a diagonal
                if (rowDiff == 1 &&
                    (((toPosition.c == fromPosition.c + 1) || (toPosition.c == fromPosition.c - 1))
                    && toPosition.p.player != currentPlayer && toPosition.p.player != "none")) {
                    break;
                }
                warningMessage = "Cannot change columns from '" + fromPosition.c + "' to '" + toPosition.c + "'.";
                isValidMove = false;
            } else if (rowDiff < 1) {
                warningMessage = "Cannot move backwards.";
                isValidMove = false;
            } else if (toPosition.p.type != "empty") {
                warningMessage = "Cannot take piece straight on.";
                isValidMove = false;
            }
            
            if (collisionDetected(fromPosition, toPosition)) {
                warningMessage = "There is a piece in the way";
                isValidMove = false;
            }

            break;
        case "bishop":
            // Allowed to move in diagonal direction

            if (!isMoveDiagonal(fromPosition, toPosition)) {
                isValidMove = false;
                warningMessage = "Must move diagonally";
                break;
            }
            
            if (collisionDetected(fromPosition, toPosition)) {
                isValidMove = false;
                warningMessage = "There is a piece in the way";
                break;
            }
            
            break;
        case "rook":
            // Allowed to move laterally
            if (!isMoveHorizontal(fromPosition, toPosition)
                && !isMoveVertical(fromPosition, toPosition)) {
                warningMessage = "Cannot move diagonally.";
                isValidMove = false;    
                break;
            }
            
            if (collisionDetected(fromPosition, toPosition)) {
                warningMessage = "There is a piece in the way";
                isValidMove = false;
                break;
            }

            break;
        case "knight":
            // Allowed to take "L" shaped move and jump over pieces.

            if (!isMoveLShaped(fromPosition, toPosition)) {
                isValidMove = false;
                warningMessage = "This is not an 'L' shaped move.";
                break;
            }

            break;
        case "queen":
            // Allowed to move any direction
            if (!(isMoveDiagonal(fromPosition, toPosition)
                || isMoveVertical(fromPosition, toPosition)
                || isMoveHorizontal(fromPosition, toPosition))) {
                warningMessage = "Must be a straight line.";
                isValidMove = false;
                break;
            }
            if (collisionDetected(fromPosition, toPosition)) {
                warningMessage = "There is a piece in the way";
                isValidMove = false;
                break;
            }

            break;
        case "king":
            // Allowed to move any direction only one space
            if (!(isMoveDiagonal(fromPosition, toPosition)
                || isMoveVertical(fromPosition, toPosition)
                || isMoveHorizontal(fromPosition, toPosition))) {
                warningMessage = "Must be a straight line.";
                isValidMove = false;
                break;
            }
            let allowedChange = 1;
            if (!isMoveOfLimitedSpaces(fromPosition, toPosition, allowedChange)) {
                warningMessage = "Move cannot be more than " + allowedChange + " space";
                isValidMove = false;
            }
            break;
        default:
            warningMessage = "Unknown piece.";
            isValidMove = false;
            break;
    }

    if (isValidMove) {
        let msg = "Valid move for '" + fromPosition.p.type + "'.";
        
        showAlert(msg, "debug");
    } else {
        if (!warningMessage) { warningMessage = "unknown problem"; }
        showAlert("Invalid move for '" + fromPosition.p.type + "'. " + warningMessage, "warning");
    }

    return isValidMove;
}

function isMoveLShaped(fromPosition, toPosition) {
    let response = false,
    rdiff = Math.abs(fromPosition.r - toPosition.r),
    cdiff = Math.abs(fromPosition.c - toPosition.c);

    if ((rdiff == 2 && cdiff == 1)
    || (rdiff == 1 && cdiff == 2)) {
        response = true;
    }

    return response;
}

/**
 * @summary Determine if 
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if path is forward with respect to player's orientation; otherwise, false
 */
function isMoveFoward(fromPosition, toPosition) {
    let response = false;

    return response;
}

/**
 * @summary Determine if move is less that the number of spaces
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @param {number} limit Number of spaces allowed
 * @returns true if path is less than or equal to {limit}; otherwise, false
 */
function isMoveOfLimitedSpaces(fromPosition, toPosition, limit) {
    let response = false,
    rdiff = Math.abs(fromPosition.r - toPosition.r),
    cdiff = Math.abs(fromPosition.c - toPosition.c);

    if (rdiff <= limit && cdiff <= limit) {
        response = true;
    }

    return response;
}

/**
 * @summary  Determines if path between two positions is diagonal
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if path is diagonal; otherwise, false
 */
function isMoveDiagonal(fromPosition, toPosition) {
    let response = false,
    rdiff = Math.abs(fromPosition.r - toPosition.r),
    cdiff = Math.abs(fromPosition.c - toPosition.c);

    if (rdiff > 0 && cdiff > 0 && rdiff == cdiff) {
        response = true;
    }
    
    return response;
}

/**
 * @summary Determines if path between two positions is strictly horizontal
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if path is horizontal; otherwise, false
 */
function isMoveHorizontal(fromPosition, toPosition) {
    let response = false;
    if (fromPosition.r == toPosition.r 
        && fromPosition.c != toPosition.c) {
        response = true;
    }
    return response;
}

/**
 * @summary Determines if path between two positions is strictly vertical
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if path is vertical; otherwise, false
 */
function isMoveVertical(fromPosition, toPosition) {
    let response = false;
    if (fromPosition.c == toPosition.c 
        && fromPosition.r != toPosition.r) {
        response = true;
    }
    return response;
}

/**
 * @summary Detect a collision on the path between two positions
 * @param {*} fromPosition 
 * @param {*} toPosition 
 * @returns true if collision is detected; otherwise, false
 */
function collisionDetected(fromPosition, toPosition) {

    let hasCollision = false;

    let rmove = (fromPosition.r > toPosition.r) ? -1 : (fromPosition.r < toPosition.r) ? 1 : 0;
    let cmove = (fromPosition.c > toPosition.c) ? -1 : (fromPosition.c < toPosition.c) ? 1 : 0;

    let nextPiece = {
        r: fromPosition.r + rmove, 
        c: fromPosition.c + cmove, 
        p: positions[fromPosition.r + rmove][fromPosition.c + cmove]
    };

    while (nextPiece.r != toPosition.r || nextPiece.c != toPosition.c) {
        if (nextPiece.p.type != "empty") {
            hasCollision = true;
            break;
        }
        nextPiece = {
            r: nextPiece.r + rmove, 
            c: nextPiece.c + cmove, 
            p: positions[nextPiece.r + rmove][nextPiece.c + cmove]
        };
    }

    return hasCollision;
}
