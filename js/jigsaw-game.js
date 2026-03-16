 (function () {
  function initGame() {
    var piecesContainer = document.getElementById('pieces-container');
    var board = document.getElementById('puzzle-board');

    var successMessage = document.getElementById('jigsaw-success');
    var fallbackMessage = document.getElementById('jigsaw-fallback');

    // Modal elements for friendly messages instead of alert()
    var modalBackdrop = document.getElementById('jigsaw-modal-backdrop');
    var modalMessageEl = document.getElementById('jigsaw-modal-message');
    var modalButton = document.getElementById('jigsaw-modal-button');

    // Guard: if required DOM elements are missing for some reason, exit early
    if (!piecesContainer || !board) {
      return;
    }

    // --- Create 9 drop zones if not present ---
    if (board.children.length < 9) {
      board.innerHTML = '';
      for (var i = 1; i <= 9; i++) {
        var cell = document.createElement('div');
        cell.className = 'drop-zone';
        cell.setAttribute('data-cell-id', i);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', 'ช่องวางจิ๊กซอว์ตำแหน่งที่ ' + i);
        board.appendChild(cell);
      }
    }

    // Add drag & drop events to all drop-zones
    var dropZones = board.querySelectorAll('.drop-zone, .jigsaw-cell');
    dropZones.forEach(function(cell) {
      cell.addEventListener('dragover', function(e) {
        e.preventDefault();
        cell.classList.add('drag-over');
      });
      cell.addEventListener('dragenter', function(e) {
        e.preventDefault();
        cell.classList.add('drag-over');
      });
      cell.addEventListener('dragleave', function(e) {
        cell.classList.remove('drag-over');
      });
      cell.addEventListener('drop', function(e) {
        e.preventDefault();
        var id = e.dataTransfer.getData('text/plain');
        var piece = board.ownerDocument.querySelector('.jigsaw-piece[data-piece-id="' + id + '"]');
        if (piece) {
          // Remove any existing piece in this cell
          var existing = cell.querySelector('.jigsaw-piece');
          if (existing && existing !== piece) {
            piecesContainer.appendChild(existing);
          }
          cell.appendChild(piece);
          piece.setAttribute('aria-grabbed', 'false');
          // ซ่อนขอบช่องเมื่อมีชิ้นส่วน
          cell.style.border = 'none';
        }
        cell.classList.remove('drag-over');
        checkCompletion();
      });
    });

    // Hide the fallback text now that JavaScript is confirmed to be running
    if (fallbackMessage) {
      fallbackMessage.classList.add('hidden');
    }

    var PIECE_COUNT = 9;

    // Utility: simple Fisher-Yates shuffle for an array
    function shuffle(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    }

    // Create an array [1, 2, ... 9] and shuffle it
    var ids = [];
    for (var n = 1; n <= PIECE_COUNT; n++) {
      ids.push(n);
    }
    shuffle(ids);

    // Track where a piece is dragged from so we can support swapping
    // pieces that are already on the board.
    var dragSourceCell = null;

    // Simple helpers to open/close the custom modal popup
    function openModal(message) {
      if (!modalBackdrop || !modalMessageEl) return;
      modalMessageEl.textContent = message;
      modalBackdrop.classList.remove('hidden');
      modalBackdrop.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      if (!modalBackdrop) return;
      modalBackdrop.classList.add('hidden');
      modalBackdrop.setAttribute('aria-hidden', 'true');
    }

    if (modalButton) {
      modalButton.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function (event) {
        if (event.target === modalBackdrop) {
          closeModal();
        }
      });
    }

    // ---- Drag and Drop handlers ----

    function handleDragStart(event) {
      var piece = event.currentTarget;

      // Remember the original container (either the pieces tray or a board cell)
      dragSourceCell = piece.parentElement || null;

      // Only proceed if the dragged element has a piece id
      var id = piece.getAttribute('data-piece-id');
      if (!id || !event.dataTransfer) return;

      // Mark piece as currently grabbed for accessibility
      piece.setAttribute('aria-grabbed', 'true');

      // Set the drag data: type 'text/plain' is widely supported
      event.dataTransfer.setData('text/plain', id);

      // Indicate that we intend to move the piece, not copy it
      event.dataTransfer.effectAllowed = 'move';
    }

    // Ensure cell visuals (dashed border vs seamless) match whether
    // a piece is currently placed inside.
    function updateCellFilledState(cell) {
      if (!cell || !cell.classList || !cell.classList.contains('jigsaw-cell')) {
        return;
      }
      if (cell.firstElementChild) {
        cell.classList.add('jigsaw-cell--filled');
      } else {
        cell.classList.remove('jigsaw-cell--filled');
      }
    }

    function handleDragOver(event) {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }

    function handleDragEnter(event) {
      var cell = event.currentTarget;
      cell.classList.add('jigsaw-cell--over');
    }

    function clearDragOverState(event) {
      var cell = event.currentTarget;
      cell.classList.remove('jigsaw-cell--over');
    }

    function handleDrop(event) {
      event.preventDefault();
      var cell = event.currentTarget;
      if (!event.dataTransfer) {
        clearDragOverState(event);
        return;
      }
      var id = event.dataTransfer.getData('text/plain');
      if (!id) {
        clearDragOverState(event);
        return;
      }
      var piece = board.ownerDocument.querySelector(
        '.jigsaw-piece[data-piece-id="' + id + '"]'
      );
      if (!piece) {
        clearDragOverState(event);
        return;
      }
      // Remove any existing piece in this cell
      var existing = cell.firstElementChild;
      if (existing && existing !== piece) {
        if (dragSourceCell && dragSourceCell !== piecesContainer) {
          dragSourceCell.appendChild(existing);
          updateCellFilledState(dragSourceCell);
        } else {
          piecesContainer.appendChild(existing);
        }
      }
      // Always append the dragged piece into this cell
      cell.appendChild(piece);
      updateCellFilledState(cell);
      // Remove highlight class after drop
      cell.classList.remove('jigsaw-cell--over');
      // Piece is no longer actively grabbed once dropped
      piece.setAttribute('aria-grabbed', 'false');
      // After each successful drop, evaluate whether the puzzle is complete
      checkCompletion();
    }

    function checkCompletion() {
      var cells = board.querySelectorAll('.jigsaw-cell');
      var filledCount = 0;
      var allCorrect = true;

      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var expectedId = cell.getAttribute('data-cell-id');
        var piece = cell.firstElementChild;

        if (!piece) {
          continue;
        }

        filledCount++;

        var pieceId = piece.getAttribute('data-piece-id');
        if (pieceId !== expectedId) {
          allCorrect = false;
        }
      }

      if (!successMessage) return;

      if (filledCount !== PIECE_COUNT) {
        successMessage.classList.add('hidden');
        return;
      }

      if (allCorrect) {
        successMessage.classList.remove('hidden');
        openModal('เย้! ต่อรูปความทรงจำของเราสมบูรณ์แล้ว! 💖');
      } else {
        successMessage.classList.add('hidden');
        openModal('อ๊ะๆ ยังต่อไม่ถูกน้า ลองสลับตำแหน่งดูใหม่นะ! 🥺');
      }
    }

    // ---- Initialize pieces and wire up events ----

    ids.forEach(function (id) {
      // กำหนดขนาดกระดานและชิ้นส่วน
      var BOARD_SIZE = 300; // px
      var GRID = 3;
      var PIECE_SIZE = BOARD_SIZE / GRID;
      var IMAGE_URL = 'images/jigsaw.jpg';

      var piece = document.createElement('div');
      piece.className = 'jigsaw-piece jigsaw-piece--' + id;
      piece.setAttribute('draggable', 'true');
      piece.setAttribute('data-piece-id', String(id));

      // Accessibility
      piece.setAttribute('role', 'button');
      piece.tabIndex = 0;
      piece.setAttribute('aria-grabbed', 'false');
      piece.setAttribute(
        'aria-label',
        'ชิ้นส่วนจิ๊กซอว์หมายเลข ' + id + ' สามารถลากได้'
      );

      // คำนวณตำแหน่ง row, col (1-based id)
      var idx = id - 1;
      var row = Math.floor(idx / GRID);
      var col = idx % GRID;
      var bgX = -col * PIECE_SIZE;
      var bgY = -row * PIECE_SIZE;

      piece.style.width = PIECE_SIZE + 'px';
      piece.style.height = PIECE_SIZE + 'px';
      piece.style.backgroundImage = "url('images/jigsaw.jpg')";
      piece.style.backgroundSize = BOARD_SIZE + 'px ' + BOARD_SIZE + 'px';
      piece.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
      piece.style.backgroundRepeat = 'no-repeat';

      piece.addEventListener('dragstart', handleDragStart);
      piecesContainer.appendChild(piece);
    });

    var cells = board.querySelectorAll('.jigsaw-cell');
    cells.forEach(function (cell) {
      var cellId = cell.getAttribute('data-cell-id');

      // ARIA metadata for drop regions
      cell.setAttribute('role', 'region');
      cell.setAttribute('aria-dropeffect', 'move');

      if (cellId) {
        cell.setAttribute('aria-label', 'ช่องวางจิ๊กซอว์ตำแหน่งที่ ' + cellId);
      }

      cell.addEventListener('dragover', handleDragOver);
      cell.addEventListener('dragenter', handleDragEnter);
      cell.addEventListener('dragleave', clearDragOverState);
    });
  }

  // Delay initialization slightly so the browser can finish painting LCP first
  setTimeout(function () {
    initGame();
    cell.addEventListener('drop', handleDrop);
})();
})();
