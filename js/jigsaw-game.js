// =============================
// เกมจิ๊กซอว์ (Jigsaw Puzzle)
// =============================
// โค้ดนี้ใช้สร้างเกมจิ๊กซอว์ 3x3 พร้อมรองรับทั้ง mouse และ touch (มือถือ)

// ฟังก์ชันหลักสำหรับเริ่มต้นเกมจิ๊กซอว์
function _initGameCore() {
    var piecesContainer = document.getElementById('pieces-container');
    var board = document.getElementById('puzzle-board');

    var successMessage = document.getElementById('jigsaw-success');
    var fallbackMessage = document.getElementById('jigsaw-fallback');

    // ตัวแปร modal สำหรับแสดงข้อความ popup (แทน alert())
    var modalBackdrop = document.getElementById('jigsaw-modal-backdrop');
    var modalMessageEl = document.getElementById('jigsaw-modal-message');
    var modalButton = document.getElementById('jigsaw-modal-button');

    // ถ้า element สำคัญหายไป จะไม่รันเกม (กัน error)
    if (!piecesContainer || !board) {
      return;
    }

    // --- สร้างช่องวางจิ๊กซอว์ 9 ช่อง ถ้ายังไม่มี ---
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

    // เพิ่ม event drag & drop ให้แต่ละช่องวาง
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

    // ซ่อนข้อความ fallback ถ้า JS ทำงานได้
    if (fallbackMessage) {
      fallbackMessage.classList.add('hidden');
    }

    var PIECE_COUNT = 9;

    // ฟังก์ชัน shuffle array (Fisher-Yates)
    function shuffle(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    }

    // สร้าง array id ชิ้นจิ๊กซอว์ 1-9 แล้วสลับลำดับ
    var ids = [];
    for (var n = 1; n <= PIECE_COUNT; n++) {
      ids.push(n);
    }
    shuffle(ids);

    // ตัวแปรเก็บ cell ต้นทางเวลาลาก (ใช้สลับชิ้นที่อยู่บนกระดาน)
    var dragSourceCell = null;

    // ฟังก์ชันเปิด/ปิด modal popup
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

    // ---- ฟังก์ชัน Drag & Drop สำหรับ desktop ----

    // เริ่มลากชิ้นจิ๊กซอว์ (desktop)
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
    // อัปเดตสถานะ cell ว่ามีชิ้นจิ๊กซอว์หรือไม่ (desktop)
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

    // ขณะลากอยู่เหนือ cell (desktop)
    function handleDragOver(event) {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }

    // ลากเข้า cell (desktop)
    function handleDragEnter(event) {
      var cell = event.currentTarget;
      cell.classList.add('jigsaw-cell--over');
    }

    // ออกจาก cell (desktop)
    function clearDragOverState(event) {
      var cell = event.currentTarget;
      cell.classList.remove('jigsaw-cell--over');
    }

    // วางชิ้นจิ๊กซอว์ลง cell (desktop)
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

    // ตรวจสอบว่าต่อจิ๊กซอว์ครบและถูกต้องหรือยัง
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


    // ---- สร้างชิ้นจิ๊กซอว์และผูก event ----
    // ตัวแปรเก็บสถานะการลากด้วยนิ้ว (touch)
    var touchDrag = {
      piece: null,
      offsetX: 0,
      offsetY: 0,
      ghost: null
    };

    // วนลูปสร้างชิ้นจิ๊กซอว์แต่ละชิ้น
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

      // ตั้งค่า accessibility ให้ชิ้นจิ๊กซอว์
      piece.setAttribute('role', 'button');
      piece.setAttribute('tabindex', '0');
      piece.setAttribute('aria-grabbed', 'false');
      piece.setAttribute('aria-label', 'ชิ้นส่วนจิ๊กซอว์หมายเลข ' + id);

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

      // ผูก event drag & drop (desktop)
      piece.addEventListener('dragstart', handleDragStart);

      // --- ฟังก์ชัน touch event สำหรับมือถือ ---
      // เริ่มลากด้วยนิ้ว (touchstart)
      piece.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        touchDrag.piece = piece;
        var touch = e.touches[0];
        var rect = piece.getBoundingClientRect();
        touchDrag.offsetX = touch.clientX - rect.left;
        touchDrag.offsetY = touch.clientY - rect.top;

        // Create ghost
        var ghost = piece.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.opacity = '0.7';
        ghost.style.zIndex = '9999';
        ghost.style.left = (touch.clientX - touchDrag.offsetX) + 'px';
        ghost.style.top = (touch.clientY - touchDrag.offsetY) + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        document.body.appendChild(ghost);
        touchDrag.ghost = ghost;
      });

      // ขณะลากด้วยนิ้ว (touchmove)
      piece.addEventListener('touchmove', function (e) {
        if (!touchDrag.piece || !touchDrag.ghost) return;
        var touch = e.touches[0];
        touchDrag.ghost.style.left = (touch.clientX - touchDrag.offsetX) + 'px';
        touchDrag.ghost.style.top = (touch.clientY - touchDrag.offsetY) + 'px';
      });

      // วางชิ้นจิ๊กซอว์ด้วยนิ้ว (touchend)
      piece.addEventListener('touchend', function (e) {
        if (!touchDrag.piece || !touchDrag.ghost) return;
        var touch = e.changedTouches[0];
        // Find drop target under finger
        var dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        while (dropTarget && !dropTarget.classList.contains('jigsaw-cell') && !dropTarget.classList.contains('drop-zone')) {
          dropTarget = dropTarget.parentElement;
        }
        if (dropTarget && (dropTarget.classList.contains('jigsaw-cell') || dropTarget.classList.contains('drop-zone'))) {
          // Remove any existing piece in this cell
          var existing = dropTarget.firstElementChild;
          if (existing && existing !== touchDrag.piece) {
            piecesContainer.appendChild(existing);
          }
          dropTarget.appendChild(touchDrag.piece);
          touchDrag.piece.setAttribute('aria-grabbed', 'false');
          dropTarget.classList.remove('drag-over');
          // Hide border if needed
          dropTarget.style.border = 'none';
          // Evaluate completion
          checkCompletion();
        }
        // Remove ghost
        if (touchDrag.ghost && touchDrag.ghost.parentNode) {
          touchDrag.ghost.parentNode.removeChild(touchDrag.ghost);
        }
        touchDrag.piece = null;
        touchDrag.ghost = null;
      });

      // เพิ่มชิ้นจิ๊กซอว์ลงถาด
      piecesContainer.appendChild(piece);
    });

    // ผูก event ให้ cell แต่ละช่อง (drag & drop)
    var cells = board.querySelectorAll('.jigsaw-cell');
    cells.forEach(function (cell) {
      var cellId = cell.getAttribute('data-cell-id');

      // ARIA metadata for drop regions
      cell.setAttribute('role', 'region');
      cell.setAttribute('aria-dropeffect', 'move');

      if (cellId) {
        cell.setAttribute('aria-label', 'ช่องว่างสำหรับวางจิ๊กซอว์ตำแหน่งที่ ' + cellId);
      }

      cell.addEventListener('dragover', handleDragOver);
      cell.addEventListener('dragenter', handleDragEnter);
      cell.addEventListener('dragleave', clearDragOverState);
    });
  }

// สร้างเกมหลังโหลดหน้าเว็บเสร็จสมบูรณ์แบบ non-blocking (ลด TBT)
window.addEventListener('load', function () {
  setTimeout(_initGameCore, 150);
});
