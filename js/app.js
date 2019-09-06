
const pieceStyles = {
    'empty': '',
    'pawn': 'fas fa-chess-pawn',
    'knight': 'fas fa-chess-knight',
    'rook': 'fas fa-chess-rook',
    'bishop': 'fas fa-chess-bishop',
    'queen': 'fas fa-chess-queen',
    'king': 'fas fa-chess-king',
}

// Toggle debug messages
var isDebug = false;


const maxRows = 8, maxColumns = 8;

var fromPosition = null,
    positions = [],
    currentPlayer = 'white',
    gameover = false;

$(document).ready(function() {
    initialize();
});

/**
 * @summary Initialize board
 * @description Creates elements within specified containers to render
 * the board and alert messages
 * @param boardSelector jQuery selector for element to place board
 * @param alertSelector jQuery selector for element to place alerts
 */
function initialize(boardSelector = "#board", alertSelector = "#second") {
     
    // Add a container for alert messages
    $(alertSelector).append(
        $("<div></div>").prop('id', 'alerts')
    );

    // Create row element to contain columns
    let $rowContainer = $("<div></div>");
    $rowContainer.addClass("row");
    let columnMarkers = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];
    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
        
        let gridMarker = $("<div></div>").text(columnMarkers[columnIndex]).addClass("marker marker-row");
        $rowContainer.append(gridMarker)
    }
    $(boardSelector).append($rowContainer);
    
    // Build rows for board
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    
        // Create row element to contain columns
        let $rowContainer = $("<div></div>");
        $rowContainer.addClass("row");

        let gridMarker = $("<div></div>").text(1 + rowIndex).addClass("marker marker-row");
        $rowContainer.append(gridMarker)

        let columns = [];
        // Build columns for board
        for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
            
            columns.push( { row: rowIndex, column: columnIndex, type: 'empty', player: 'none', moveCount: 0 });

            // Create new tile
            let tile = $("<div></div>");
            tile.prop('id', "R" + rowIndex + "C" + columnIndex);
            tile.addClass("tile");

            // Set the tile css; default to 'dark'; 
            // Alternate 'light' for odd row and even column or even row and odd column
            let tileClass = "dark";
            if ((rowIndex % 2 === 1 && columnIndex % 2 === 0) 
                || (rowIndex % 2 === 0 && columnIndex % 2 === 1)) {
                tileClass = "light";
            } 
            tile.addClass(tileClass);

            // Add tile event handlers
            $(tile).on("click", () => movePiece(rowIndex, columnIndex) );
            
            // Add tile to row
            $rowContainer.append(tile);
        }

        gridMarker = $("<div></div>").text(1 + rowIndex).addClass("marker marker-row");
        $rowContainer.append(gridMarker)

        positions[rowIndex] =  columns;

        // Add row to board container
        $(boardSelector).append($rowContainer);
    }


    // Create row element to contain columns
    $rowContainer = $("<div></div>");
    $rowContainer.addClass("row");
    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
        
        let gridMarker = $("<div></div>").text(columnMarkers[columnIndex]).addClass("marker marker-row");
        $rowContainer.append(gridMarker)
    }
    $(boardSelector).append($rowContainer);
    

    // Initialize Trays
    let $whiteTray = $("<div></div>").prop("id", "white_tray").addClass("tray"),
        $blackTray = $("<div></div>").prop("id", "black_tray").addClass("tray");
    $(boardSelector).before($whiteTray).after($blackTray);

    initializePieces();
    render();
}

/**
 * 
 * @param {number} row 
 * @param {number} column 
 */
function movePiece(row, column) {

    $("#alerts").empty();

    // Start Move
    if (!fromPosition) {
    
        if (positions[row][column].type === "empty")  {

            showAlert("Nothing to move.", 'warning');
            return;
        } 

        if (positions[row][column].player !== currentPlayer) {

            showAlert("It is not your turn.", 'warning');
            return;
        } 

        showAlert("Where do you want to move your " + positions[row][column].type + "?");

        fromPosition = { r: row, c: column, p: positions[row][column] };
        $('#R' + row + 'C' + column).addClass('selected');
        
    // Finish Move
    } else {

        if (fromPosition.r == row && fromPosition.c == column) {
            $('#R' + fromPosition.r + 'C' + fromPosition.c).removeClass('selected');
            fromPosition = null;
            return;
        }

        let nextPosition = { r: row, c: column, p: positions[row][column] };

        if (nextPosition.p.player === fromPosition.p.player) {
            showAlert(fromPosition.p.player + " has decided to change piece from '" + fromPosition.p.type + "' to '" + nextPosition.p.type + "'.", 'debug');
            $('#R' + fromPosition.r + 'C' + fromPosition.c).removeClass('selected');
            $('#R' + nextPosition.r + 'C' + nextPosition.c).addClass('selected');
            fromPosition = nextPosition;
            return;
        }

        // Verify Move
        if (validateMove(fromPosition, nextPosition)) {

            if (nextPosition.p.player != "none" && nextPosition.p.player != currentPlayer) {
                $("#" + currentPlayer + "_tray").append($('#R' + nextPosition.r + 'C' + nextPosition.c).children());
                showAlert(currentPlayer + " took " + nextPosition.p.player + "'s " + nextPosition.p.type);
                if (nextPosition.p.type == 'king') {
                    showAlert(currentPlayer + " has won the game!");
                    gameover = true;
                }
            }

            // Swap the positions for the piece
            positions[row][column] = positions[fromPosition.r][fromPosition.c];
            positions[row][column].moveCount++;
            positions[fromPosition.r][fromPosition.c] = { type: 'empty', player: 'none' };
         
            if (currentPlayer == 'white' && nextPosition.r == (maxRows -1)) {
                showAlert("You should be able to get a piece back. This isn't working yet.");
            }

            // Reset and change the active player
            $('#R' + fromPosition.r + 'C' + fromPosition.c).removeClass('selected');
            fromPosition = null;
            currentPlayer = (currentPlayer === "white") ? "black" : "white";
            
            render();
        }
    }
}

function render() {

    $('#board').removeClass("active-player-white active-player-black").addClass("active-player-" + currentPlayer);

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

function initializePieces() {

    positions[0][0].player = "white";
    positions[0][1].player = "white";
    positions[0][2].player = "white";
    positions[0][3].player = "white";
    positions[0][4].player = "white";
    positions[0][5].player = "white";
    positions[0][6].player = "white";
    positions[0][7].player = "white";
    positions[1][0].player = "white";
    positions[1][1].player = "white";
    positions[1][2].player = "white";
    positions[1][3].player = "white";
    positions[1][4].player = "white";
    positions[1][5].player = "white";
    positions[1][6].player = "white";
    positions[1][7].player = "white";


    positions[6][0].player = "black";
    positions[6][1].player = "black";
    positions[6][2].player = "black";
    positions[6][3].player = "black";
    positions[6][4].player = "black";
    positions[6][5].player = "black";
    positions[6][6].player = "black";
    positions[6][7].player = "black";
    positions[7][0].player = "black";
    positions[7][1].player = "black";
    positions[7][2].player = "black";
    positions[7][3].player = "black";
    positions[7][4].player = "black";
    positions[7][5].player = "black";
    positions[7][6].player = "black";
    positions[7][7].player = "black";

    positions[0][0].type = "rook";
    positions[0][1].type = "knight";
    positions[0][2].type = "bishop";
    positions[0][3].type = "queen";
    positions[0][4].type = "king";
    positions[0][5].type = "bishop";
    positions[0][6].type = "knight";
    positions[0][7].type = "rook";

    positions[1][0].type = "pawn";
    positions[1][1].type = "pawn";
    positions[1][2].type = "pawn";
    positions[1][3].type = "pawn";
    positions[1][4].type = "pawn";
    positions[1][5].type = "pawn";
    positions[1][6].type = "pawn";
    positions[1][7].type = "pawn";

    positions[6][0].type = "pawn";
    positions[6][1].type = "pawn";
    positions[6][2].type = "pawn";
    positions[6][3].type = "pawn";
    positions[6][4].type = "pawn";
    positions[6][5].type = "pawn";
    positions[6][6].type = "pawn";
    positions[6][7].type = "pawn";

    positions[7][0].type = "rook";
    positions[7][1].type = "knight";
    positions[7][2].type = "bishop";
    positions[7][3].type = "queen";
    positions[7][4].type = "king";
    positions[7][5].type = "bishop";
    positions[7][6].type = "knight";
    positions[7][7].type = "rook";
}

function showAlert(message, type = "info") {

    if (type === "debug" && !isDebug) { return; }
    
    let $alert = $("<div></div>")
      .addClass("alert alert-" + type)
      .text(message);

    $("#alerts").append($alert);
}

function validateMove(fromPosition, toPosition) {

    let isValidMove = true;
    let warningMessage = "";
    let colorMultiplier = (currentPlayer === "white") ? 1 : -1;

    switch (fromPosition.p.type) {
        case 'pawn':

            // isMoveForward()
            // && isMoveSingle()
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
                    && toPosition.p.player != currentPlayer && toPosition.p.player != 'none')) {
                    break;
                }
                warningMessage = "Cannot change columns from '" + fromPosition.c + "' to '" + toPosition.c + "'.";
                isValidMove = false;
            } else if (rowDiff < 1) {
                warningMessage = "Cannot move backwards.";
                isValidMove = false;
            } else if (toPosition.p.type != 'empty') {
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
            // Allowed to take 'L' shaped move and jump over pieces.

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

function isMoveFoward(fromPosition, toPosition) {
    let response = false;

    return response;
}

function isMoveOfLimitedSpaces(fromPosition, toPosition, limit) {
    let response = false,
    rdiff = Math.abs(fromPosition.r - toPosition.r),
    cdiff = Math.abs(fromPosition.c - toPosition.c);

    if (rdiff <= limit && cdiff <= limit) {
        response = true;
    }

    return response;
}

function isMoveDiagonal(fromPosition, toPosition) {
    let response = false,
    rdiff = Math.abs(fromPosition.r - toPosition.r),
    cdiff = Math.abs(fromPosition.c - toPosition.c);

    if (rdiff > 0 && cdiff > 0 && rdiff == cdiff) {
        response = true;
    }
    
    return response;
}

function isMoveHorizontal(fromPosition, toPosition) {
    let response = false;
    if (fromPosition.r == toPosition.r 
        && fromPosition.c != toPosition.c) {
        response = true;
    }
    return response;
}

function isMoveVertical(fromPosition, toPosition) {
    let response = false;
    if (fromPosition.c == toPosition.c 
        && fromPosition.r != toPosition.r) {
        response = true;
    }
    return response;
}

function collisionDetected(fromPosition, toPosition) {

    let currentPiece = fromPosition.p,
        hasCollision = false;

    console.info("From Position: (" + fromPosition.r + ", " + fromPosition.c + ")");

    let rmove = (fromPosition.r > toPosition.r) ? -1 : (fromPosition.r < toPosition.r) ? 1 : 0;
    let cmove = (fromPosition.c > toPosition.c) ? -1 : (fromPosition.c < toPosition.c) ? 1 : 0;

    let nextPiece = {
        r: fromPosition.r + rmove, 
        c: fromPosition.c + cmove, 
        p: positions[fromPosition.r + rmove][fromPosition.c + cmove]
    };

    let counter = 0;
    while (nextPiece.r != toPosition.r || nextPiece.c != toPosition.c) {
    
        console.info("Checking nextPiece: (" + nextPiece.r + ", " + nextPiece.c + ") has '" + nextPiece.p.type + "'");
        if (nextPiece.p.type != 'empty') {
            hasCollision = true;
            break;
        }
        nextPiece = {
            r: nextPiece.r + rmove, 
            c: nextPiece.c + cmove, 
            p: positions[nextPiece.r + rmove][nextPiece.c + cmove]
        };    
        if (counter++ > 70) {
            throw "We've GONE TOO FAR"; 
            break;
        }
    }

    console.info("To Position: (" + toPosition.r + ", " + toPosition.c + ")");

    return hasCollision;
}