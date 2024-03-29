
const pieceStyles = {
    "empty": "fa fa-circle",
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
    moveHistory = [],
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
            $(tile).on("click", () => { movePiece(rowIndex, columnIndex); } );
            
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
    let $themingWrapper = $("<div></div>"),
        $themeLabel = $("<label></label>").prop("for",  "theme_selector").text("Theme"),
        $themeSelector = $("<select></select>").prop("id", "theme_selector"),
        $whiteTray = $("<div></div>").prop("id", "white_tray").addClass("tray"),
        $blackTray = $("<div></div>").prop("id", "black_tray").addClass("tray");
    availableStyles.forEach(s => $themeSelector.append("<option value='" + s + "'>" + s + "</option>"));
    $themeSelector.on("change", function () { changeTheme(boardSelector, this.value); });
    $themingWrapper.append($themeLabel, $themeSelector);
    $boardWrapper.before($themingWrapper, $whiteTray).after($blackTray);


    let $promotionDialog = $("<div></div>").prop("id", "promotionDialog").addClass("dialog-promotion hidden");
    let $queen =$("<i></i>").addClass(pieceStyles["queen"]).on("click", function () { selectPromotion("queen"); }),
    $rook =$("<i></i>").addClass(pieceStyles["rook"]).on("click", function () { selectPromotion("rook"); }),
    $bishop =$("<i></i>").addClass(pieceStyles["bishop"]).on("click", function () { selectPromotion("bishop"); }),
    $knight =$("<i></i>").addClass(pieceStyles["knight"]).on("click", function () { selectPromotion("knight"); });
    
    $promotionDialog.append($queen, $rook, $bishop, $knight);
    
    $boardWrapper.after($promotionDialog);

    initializePieces();
    render(boardSelector);
}

function selectPromotion(type) {

    if (!type)  {
        console.warn("selectPromotion('"+ type + "') 'type' must have value.");
        return;
    }
    if (moveHistory.length > 0) {

        moveHistory[moveHistory.length -1].p.type = type;
        $("#first").children().first().remove();
        showAlert("You have selected '" + type + "'.");
        $("#promotionDialog").dialog("close");
        
        /* TODO: This is not really what I want to do but it works */
        let lastMoveIndex = moveHistory.length -1,
        lastMove = moveHistory[lastMoveIndex]; 
        
        let $tile = getTile(lastMove.t.r, lastMove.t.c);
        $tile.children().removeClass("fa-chess-pawn").addClass(pieceStyles[lastMove.p.type])
        positions[lastMove.t.r][lastMove.t.c].type = lastMove.p.type;

        let row = buildMoveHistory(lastMove, lastMoveIndex);
        $("#first").children().first().before(row);
    } else {
        console.warn("selectPromotion('" + type + "') moveHistory contained no values.");
    }
}

function getLastMove() {
    let lastMoveIndex = moveHistory.length -1;
    return moveHistory[lastMoveIndex]; 
}

function getTile(row, column) {
    return $("#R" + row + "C" + column);
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
    
        let position = positions[row][column];

        if (position.type === "empty")  {
            showAlert("Nothing to move.", "warning");
            return;
        } 

        if (position.player !== currentPlayer) {
            showAlert("It is not your turn.", "warning");
            return;
        } 

        // Hide last move indicator
        if (moveHistory.length > 0) {
            let lastMove = moveHistory[moveHistory.length -1];
            showMove(lastMove.f.r, lastMove.f.c, lastMove.t.r, lastMove.t.c, false);
        }

        showAlert("Where do you want to move your " + position.type + "?");

        fromPosition = { r: row, c: column, p: position };
        $("#R" + row + "C" + column).addClass("selected");
        showValidMove(fromPosition);
        
    // Finish Move
    } else {

        if (fromPosition.r == row && fromPosition.c == column) {
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            showValidMove(fromPosition, false);
            fromPosition = null;
            
            // Show the last move again
            let lastMove = moveHistory[moveHistory.length -1];
            showMove(lastMove.f.r, lastMove.f.c, lastMove.t.r, lastMove.t.c);

            return;
        }

        let nextPosition = { r: row, c: column, p: positions[row][column] };

        if (nextPosition.p.player === fromPosition.p.player) {
            showAlert(fromPosition.p.player + " has decided to change piece from '" + fromPosition.p.type + "' to '" + nextPosition.p.type + "'.", "debug");
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            $("#R" + nextPosition.r + "C" + nextPosition.c).addClass("selected");
            showValidMove(fromPosition, false);
            showValidMove(nextPosition);
            fromPosition = nextPosition;
            return;
        }

        // Verify Move
        if (validateMove(fromPosition, nextPosition)) {

            let takenPiece = null;
            if (nextPosition.p.player != "none" && nextPosition.p.player != currentPlayer) {
                $("#" + currentPlayer + "_tray").append($("#R" + nextPosition.r + "C" + nextPosition.c).children());
                takenPiece = nextPosition.p;
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
         
            // Promotion
            let promotion = null;
            if (fromPosition.p.type === "pawn" && nextPosition.r === getMaxRowForCurrentPlayer()) {
                $("#promotionDialog").dialog( {
                    minHeight: 100,
                    dialog: true,
                    classes: { "ui-dialog": "player-" + currentPlayer}, 
                    title: "Select your piece"
                });
                $("#promotionDialog").dialog("open");
                

                showAlert("You should be able to get a piece back. This isn't working yet.");
                promotion = { type: "queen", player: currentPlayer };
            }

            moveHistory.push({ f: fromPosition, t: nextPosition, x: takenPiece, p: promotion });
            showMove(fromPosition.r, fromPosition.c, nextPosition.r, nextPosition.c);

            // Reset and change the active player
            $("#R" + fromPosition.r + "C" + fromPosition.c).removeClass("selected");
            showValidMove(fromPosition, false);
            fromPosition = null;
            currentPlayer = (currentPlayer === "white") ? "black" : "white";

            render("#board");
        }
    }
}

function getMaxRowForCurrentPlayer() {
    
    if (currentPlayer === "white") {
        return (maxRows -1)
    }

    if (currentPlayer === "black") {
        return 0;
    }
}

function showValidMove(fromPosition, show = true) {
    if (!fromPosition) {
        throw "Argument Null: fromPosition";
    }

    positions.forEach((row, rowIndex) => row.forEach((position, columnIndex) => {
        
        let toPosition = { r: rowIndex, c: columnIndex, p: position };
        $("#R" + toPosition.r + "C" + toPosition.c).removeClass("valid")
        if (show && validateMove(fromPosition, toPosition, false)) {
            $("#R" + toPosition.r + "C" + toPosition.c).addClass("valid")
        }
    }))
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

    if (moveHistory.length > 0) {
        let i = moveHistory.length -1;
        let m = moveHistory[i];
        let $row = buildMoveHistory(m, i);
        if ($("#first").children()[0]) {

            $("#first").children().first().before($row);
        } else {
            $("#first").append($row);
        }
    }
}

function buildMoveHistory(m, i) {
    let $row = $("<div></div>").prop("id", "move_" + i).addClass("move-history");

    let fromSpan = $("<span></span>").addClass("from").text( m.f.r + "," + m.f.c ),
    toSpan = $("<span></span>").addClass("to").text( m.t.r + "," + m.t.c ),
    pieceIcon = $("<i></i>").addClass(pieceStyles[m.f.p.type] + " player-" + m.f.p.player),
    arrowIcon = $("<i></i>").addClass("fas fa-arrow-right");
    $row.append(pieceIcon,fromSpan, arrowIcon, toSpan);

    // Taken Piece
    if (m.x) {
        let $takenSpan = $("<span></span>").addClass("fa-stack"),
        $takenPieceIcon = $("<i></i>").addClass("fa-stack-1x " + pieceStyles[m.x.type] + " player-" + m.x.player),
        $banIcon = $("<i></i>").addClass("fa-stack-2x text-tomato fas fa-ban");
        $takenSpan.append($takenPieceIcon, $banIcon);
        $row.append($takenSpan);
    }

    // Promotion
    if (m.p) {
        let $promoSpan = $("<span></span>").addClass("fa-stack"),
        $promoPieceIcon = $("<i></i>").addClass("fa-stack-1x " + pieceStyles[m.p.type] + " player-" + m.p.player),
        $circleIcon = $("<i></i>").addClass("fa-stack-2x text-green far fa-circle");
        $promoSpan.append($promoPieceIcon, $circleIcon);
        $row.append($promoSpan);
    }

    $row.on("mouseover", function() { showMove(m.f.r, m.f.c, m.t.r, m.t.c);});
    $row.on("mouseout", function() { showMove(m.f.r, m.f.c, m.t.r, m.t.c, false);});

    return $row;
}

/**
 * @summary Highlight the from and to positions of a move
 * @param {number} fromRow 
 * @param {number} fromColumn 
 * @param {number} toRow 
 * @param {number} toColumn 
 * @param {number} show 
 */
function showMove(fromRow, fromColumn, toRow, toColumn, show = true) {
    if (fromRow == undefined 
        || fromColumn == undefined
        || toRow == undefined
        || toColumn == undefined) throw "Arguments cannot be null";

    let $from = $("#R" + fromRow + "C" + fromColumn),
    $to = $("#R" + toRow + "C" + toColumn);

    if (show) {
        $from.addClass("from");
        $to.addClass("to");
    } else {
        $from.removeClass("from");
        $to.removeClass("to");
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
function validateMove(fromPosition, toPosition, verbose = true) {

    let isValidMove = false;
    let warningMessage = "";

    if (toPosition.p.player == currentPlayer) {
        return false;
    }

    switch (fromPosition.p.type) {
        case "pawn":

            // Allow for up to two row changes on first move
            let allowedRowChange = (fromPosition.p.moveCount > 0) ? 1 : 2;
            if (isMoveForward(fromPosition, toPosition)) {
                // Valid forward move
                isValidMove = (isMoveVertical(fromPosition, toPosition)
                && isMoveOfLimitedSpaces(fromPosition, toPosition, allowedRowChange)
                && toPosition.p.player == "none")
                // Valid takeover
                || (isMoveDiagonal(fromPosition, toPosition)
                    && isMoveOfLimitedSpaces(fromPosition, toPosition, 1)
                    && toPosition.p.player != "none");
            }
            
            break;
        case "bishop":
            // Allowed to move in diagonal direction
            isValidMove = isMoveDiagonal(fromPosition, toPosition);
            warningMessage = "Move must be diagonal.";
            break;
        case "rook":
            // Allowed to move laterally
            isValidMove = (isMoveHorizontal(fromPosition, toPosition)
                || isMoveVertical(fromPosition, toPosition));
                warningMessage = "Move must be vertical or horizontal.";
            break;
        case "knight":
            // Allowed to take "L" shaped move and jump over pieces.
            isValidMove = isMoveLShaped(fromPosition, toPosition);
            warningMessage = "This is not an 'L' shaped move.";
            break;
        case "queen":
            // Allowed to move any direction
            isValidMove = (isMoveDiagonal(fromPosition, toPosition)
                || isMoveVertical(fromPosition, toPosition)
                || isMoveHorizontal(fromPosition, toPosition));
            
            break;
        case "king":
            // Allowed to move any direction only one space
            let allowedChange = 1;
            isValidMove = (isMoveDiagonal(fromPosition, toPosition)
                || isMoveVertical(fromPosition, toPosition)
                || isMoveHorizontal(fromPosition, toPosition))
                && isMoveOfLimitedSpaces(fromPosition, toPosition, allowedChange);
            
            break;
        default:
            warningMessage = "Unknown piece.";
            isValidMove = false;
            break;
    }

    let collisions = ["queen", "bishop", "rook", "pawn"];
    if (isValidMove && collisions.includes(fromPosition.p.type)
        && collisionDetected(fromPosition, toPosition)) {
        isValidMove = false;
        warningMessage = "There is a piece in the way.";
    }

    if (isValidMove && verbose) {
        let msg = "Valid move for '" + fromPosition.p.type + "'.";
        showAlert(msg, "debug");
    } else if (verbose) {
        
        if (!warningMessage) { warningMessage = "unknown problem"; }
        showAlert("Invalid move for '" + fromPosition.p.type + "'. " + warningMessage, "warning");
    }

    return isValidMove;
}

/**
 * @summary Determine if move is 'L' shaped for knight
 * @param {*} fromPosition 
 * @param {*} toPosition 
 */
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
function isMoveForward(fromPosition, toPosition) {
    let response = false;

    let directionMultiplier = (fromPosition.p.player == "white") ? 1 : -1,
        rdiff = (toPosition.r - fromPosition.r) * directionMultiplier;
    
    if (rdiff > 0) {
        response = true;
    }

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
        let nextR = nextPiece.r + rmove,
            nextC = nextPiece.c + cmove,
            nextP = positions[nextR][nextC];

        if (nextP) {
            nextPiece = {
                r: nextPiece.r + rmove, 
                c: nextPiece.c + cmove, 
                p: positions[nextPiece.r + rmove][nextPiece.c + cmove]
            };
        } else {
            // Out of bounds
            break;
        }
    }

    return hasCollision;
}
