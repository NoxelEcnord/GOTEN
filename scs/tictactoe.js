const games = new Map();

function createBoard() {
    return [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9']
    ];
}

function printBoard(board) {
    return board.map(row => row.join(' | ')).join('\n---------\n');
}

function checkWin(board, player) {
    // Check rows
    for (let row = 0; row < 3; row++) {
        if (board[row][0] === player && board[row][1] === player && board[row][2] === player) {
            return true;
        }
    }
    
    // Check columns
    for (let col = 0; col < 3; col++) {
        if (board[0][col] === player && board[1][col] === player && board[2][col] === player) {
            return true;
        }
    }
    
    // Check diagonals
    if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
        return true;
    }
    if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
        return true;
    }
    
    return false;
}

function isBoardFull(board) {
    return board.flat().every(cell => cell === 'X' || cell === 'O');
}

async function execute(message, zk, options) {
    const { repondre, arg } = options;
    const chatId = message.key.remoteJid;
    
    if (!games.has(chatId)) {
        // Start new game
        const board = createBoard();
        games.set(chatId, {
            board,
            currentPlayer: 'X',
            playerX: message.key.participant || message.key.remoteJid,
            playerO: null
        });
        
        return repondre(
            `🎮 *Tic Tac Toe Game Started!*\n\n` +
            `${printBoard(board)}\n\n` +
            `Player X: ${message.pushName}\n` +
            `Waiting for Player O...\n\n` +
            `Type "join" to join as Player O`
        );
    }
    
    const game = games.get(chatId);
    
    if (arg[0] === 'join' && !game.playerO) {
        game.playerO = message.key.participant || message.key.remoteJid;
        return repondre(
            `Player O joined: ${message.pushName}\n\n` +
            `${printBoard(game.board)}\n\n` +
            `Player X's turn (1-9)`
        );
    }
    
    if (arg[0] === 'end') {
        games.delete(chatId);
        return repondre('Game ended!');
    }
    
    const move = parseInt(arg[0]);
    if (isNaN(move) || move < 1 || move > 9) {
        return repondre('Please enter a number between 1 and 9');
    }
    
    const row = Math.floor((move - 1) / 3);
    const col = (move - 1) % 3;
    
    if (game.board[row][col] === 'X' || game.board[row][col] === 'O') {
        return repondre('That position is already taken!');
    }
    
    const currentPlayerId = message.key.participant || message.key.remoteJid;
    if ((game.currentPlayer === 'X' && currentPlayerId !== game.playerX) ||
        (game.currentPlayer === 'O' && currentPlayerId !== game.playerO)) {
        return repondre("It's not your turn!");
    }
    
    game.board[row][col] = game.currentPlayer;
    
    if (checkWin(game.board, game.currentPlayer)) {
        const winner = game.currentPlayer === 'X' ? 'Player X' : 'Player O';
        games.delete(chatId);
        return repondre(
            `🎉 *${winner} Wins!*\n\n` +
            `${printBoard(game.board)}`
        );
    }
    
    if (isBoardFull(game.board)) {
        games.delete(chatId);
        return repondre(
            `🤝 *It's a Draw!*\n\n` +
            `${printBoard(game.board)}`
        );
    }
    
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    const nextPlayer = game.currentPlayer === 'X' ? 'Player X' : 'Player O';
    
    repondre(
        `${printBoard(game.board)}\n\n` +
        `${nextPlayer}'s turn (1-9)`
    );
}

module.exports = {
    nomCom: 'tictactoe',
    execute
}; 