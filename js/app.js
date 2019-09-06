
const pieceStyles = {
    'empty': '',
    'pawn': 'fas fa-chess-pawn',
    'knight': 'fas fa-chess-knight',
    'rook': 'fas fa-chess-rook',
    'bishop': 'fas fa-chess-bishop',
    'queen': 'fas fa-chess-queen',
    'king': 'fas fa-chess-king',
}

const maxRows = 8, maxColumns = 8;

var fromPosition = null,
    positions = [],
    currentPlayer = 'white';

$(document).ready(function() {
    initialize();
});

/**
 * @summary Initialize board
 */
function initialize(boardSelector = "#board", alertSelector = "#second") {
     
    // Add a container for alert messages
    $(alertSelector).append(
        $("<div></div>").prop('id', 'alerts')
    );

    // Build rows for board
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    
        // Create row element to contain columns
        let $rowContainer = $("<div></div>");
        $rowContainer.addClass("row");

        let columns = [];
        // Build columns for board
        for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
            
            columns.push( { row: rowIndex, column: columnIndex, type: 'empty', player: 'none' });

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

        positions[rowIndex] =  columns;

        // Add row to board container
        $(boardSelector).append($rowContainer);
    }
    initializePieces();
    render();
}

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

        showAlert("Where do you want to move your " + positions[row][column].type);

        fromPosition = { r: row, c: column, p: positions[row][column] };
        $('#R' + row + 'C' + column).addClass('selected');
        
    // Finish Move
    } else {

        let nextPosition = { r: row, c: column, p: positions[row][column] };

        // Verify Move
        if (validateMove(fromPosition, nextPosition)) {

            // Swap the positions for the piece
            positions[row][column] = positions[fromPosition.r][fromPosition.c];
            positions[fromPosition.r][fromPosition.c] = { type: 'empty', player: 'none' };
            
            // Reset and change the active player
            $('#R' + fromPosition.r + 'C' + fromPosition.c).removeClass('selected');
            fromPosition = null;
            currentPlayer = (currentPlayer === "white") ? "black" : "white";
            
            render();
        }
    }
}

function render() {

    for (let r = 0; r < positions.length; r++) {
        for (let c = 0; c < positions[r].length; c++) {

            let p = positions[r][c];
            
            let icon = $("<i></i>").addClass(pieceStyles[p.type] + " player-" + p.player );
            $("#R" + r + "C" + c)
                .empty()
                .append(icon);
        }
    }
    showAlert("It is your turn: " + currentPlayer);
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

    let $alert = $("<div></div>")
      .addClass("alert alert-" + type)
      .text(message);

    $("#alerts").append($alert);
}

function validateMove(fromPosition, toPosition) {

    let isValidMove = true;
    
    // if (fromPosition.p.player == toPosition.p.player) {
    //     showAlert("You can't take your own piece.", 'warning');
    //     isValidMove = false;
    //     return;
    // }
    
    let colorMultiplier = (currentPlayer === "white") ? 1 : -1;

    switch (fromPosition.p.type) {
        case 'pawn':
            if (toPosition.c != fromPosition.c) {
                showAlert("Invalid move for the pawn", 'warning');                
                isValidMove = false;
            } else  if (toPosition.r > fromPosition.r + (1 * colorMultiplier)) {
                showAlert("Invalid move for the pawn", 'warning');
                isValidMove = false;
            } else {
                showAlert("Valid move for the pawn");
            }
            break;
            default:
                    showAlert("Unknown piece: '" + fromPosition.p.type + "'");
                isValidMove = false;
                break;
    }

    return isValidMove;
}