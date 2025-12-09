// シンプルな時間割アプリ（変更点：入力済みコマは科目名をセル上に表示、課題チェックはコマをクリックして開いたモーダル内でのみ表示）
(function(){
  // 設定
  const DAYS = ["月","火","水","木","金"];
  const PERIODS = 6;
  const ASSIGNMENT_COUNT = 15;
  const STORAGE_KEY = "timetableData_v1";
  const SETTINGS_KEY = "timetableSettings_v1";

  // DOM
  const table = document.getElementById("timetable");
  const editToggle = document.getElementById("editToggle");
  const bgPicker = document.getElementById("bgColorPicker");
  const clearAllBtn = document.getElementById("clearAll");

  const modal = document.getElementById("modal");
  const subjectInput = document.getElementById("subject");
  const roomInput = document.getElementById("room");
  const timeInput = document.getElementById("time");
  const assignmentsGrid = document.getElementById("assignmentsGrid");
  const saveBtn = document.getElementById("saveBtn");
  const closeBtn = document.getElementById("closeBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  let store = {}; // セルごとのデータ
  let settings = { bgColor: "#ffffff" };
  let currentCellId = null;

  // 初期化
  function init(){
    loadSettings();
    applyBgColor();
    loadData();
    buildTable();
    renderAll();

    // 初回: データが空なら編集モードON
    if(Object.keys(store).length === 0){
      editToggle.checked = true;
    } else {
      editToggle.checked = false;
    }

    bgPicker.addEventListener("input", () => {
      settings.bgColor = bgPicker.value;
      applyBgColor();
      saveSettings();
    });
    clearAllBtn.addEventListener("click", handleClearAll);

    saveBtn.addEventListener("click", handleSave);
    closeBtn.addEventListener("click", closeModal);
    deleteBtn.addEventListener("click", handleDelete);
    // モーダル外クリックで閉じる
    modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
    // キーボード: Esc で閉じる
    document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeModal(); });

    // 編集モード切替時にセルの表示を更新
    editToggle.addEventListener("change", () => {
      renderAll();
    });
  }

  function loadSettings(){
    try{
      const raw = localStorage.getItem(SETTINGS_KEY);
      if(raw) settings = JSON.parse(raw);
    }catch(e){ console.error(e); }
    bgPicker.value = settings.bgColor || "#ffffff";
  }
  function saveSettings(){
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function applyBgColor(){
    document.documentElement.style.setProperty('--bg', settings.bgColor || "#ffffff");
  }

  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      store = raw ? JSON.parse(raw) : {};
    }catch(e){ console.error(e); store = {}; }
  }
  function saveData(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }catch(e){ console.error(e); }
  }

  function buildTable(){
    // header
    table.innerHTML = "";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(document.createElement("th")); // 左上空白
    DAYS.forEach(d => {
      const th = document.createElement("th");
      th.textContent = d;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // body
    const tbody = document.createElement("tbody");
    for(let p=1;p<=PERIODS;p++){
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = `${p}限`;
      tr.appendChild(th);

      for(let c=1;c<=DAYS.length;c++){
        const td = document.createElement("td");
        const cellId = cellIdFor(p,c);
        td.setAttribute("data-cellid", cellId);
        td.className = "tcell";
        td.addEventListener("click", ()=> openCell(cellId));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  function renderAll(){
    for(let p=1;p<=PERIODS;p++){
      for(let c=1;c<=DAYS.length;c++){
        renderCell(cellIdFor(p,c));
      }
    }
  }

  function renderCell(cellId){
    const td = table.querySelector(`td[data-cellid="${cellId}"]`);
    if(!td) return;
    const data = store[cellId];
    td.innerHTML = "";

    // 要望: 入力された科目名があればセル上に常時表示する
    if(data && data.subject){
      const title = document.createElement("div");
      title.className = "cell-title";
      title.textContent = data.subject;
      td.appendChild(title);

      // 小さなインジケータは残す（課題など他データの有無を示すため）
      if((data.assignments && data.assignments.some(Boolean)) || data.room || data.time){
        const indicator = document.createElement("div");
        indicator.className = "cell-indicator";
        indicator.title = `詳細あり (${humanLabel(cellId)})`;
        td.appendChild(indicator);
      }
      // 科目名のみ表示する仕様なので教室や時間はセル上に出さない
      return;
    }

    // 科目名がないが他データ（課題チェック等）がある場合は目印のみ表示
    if(data && ((data.assignments && data.assignments.some(Boolean)) || data.room || data.time)){
      const indicator = document.createElement("div");
      indicator.className = "cell-indicator";
      indicator.title = `内容あり (${humanLabel(cellId)})`;
      td.appendChild(indicator);

      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = "（登録あり）";
      ph.style.opacity = 0.6;
      td.appendChild(ph);
      return;
    }

    // 完全に空の場合
    const ph = document.createElement("div");
    ph.className = "placeholder";
    ph.textContent = "（空）";
    td.appendChild(ph);
  }

  function cellIdFor(period, col){
    return `r${period}-c${col}`;
  }

  // r{period}-c{col} を "月1" 形式に変換
  function humanLabel(cellId){
    const m = String(cellId).match(/^r(\d+)-c(\d+)$/);
    if(!m) return cellId;
    const period = m[1];
    const col = parseInt(m[2], 10);
    const day = DAYS[col - 1] || `c${col}`;
    return `${day}${period}`;
  }

  // モーダル関連
  function openCell(cellId){
    currentCellId = cellId;
    const data = store[cellId] || createEmptyCell();

    // 課題チェックは「コマをクリックしてから」表示する = モーダル内にだけ作る（ここで生成）
    buildAssignments(data.assignments || []);

    const editingEnabled = editToggle.checked;

    // 編集モードのときのみ科目名等の入力フィールドを表示して編集可能にする
    // 編集モードでない場合は入力フィールドは非表示（課題は操作可能）
    if(editingEnabled){
      subjectInput.parentElement.style.display = "";
      roomInput.parentElement.style.display = "";
      timeInput.parentElement.style.display = "";

      subjectInput.disabled = false;
      roomInput.disabled = false;
      timeInput.disabled = false;

      subjectInput.value = data.subject || "";
      roomInput.value = data.room || "";
      timeInput.value = data.time || "";

      saveBtn.style.display = "";
      deleteBtn.style.display = "";
    }else{
      subjectInput.parentElement.style.display = "none";
      roomInput.parentElement.style.display = "none";
      timeInput.parentElement.style.display = "none";

      subjectInput.disabled = true;
      roomInput.disabled = true;
      timeInput.disabled = true;

      saveBtn.style.display = "none";
      deleteBtn.style.display = "none";
    }

    // モーダルタイトルにセル情報を追記（"月1" 形式）
    const title = document.getElementById("modalTitle");
    title.textContent = editingEnabled
      ? `コマ編集 (${humanLabel(cellId)})`
      : `課題確認 (${humanLabel(cellId)})`;

    modal.classList.remove("hidden");

    // 編集モードなら最初の入力にフォーカス
    if(editingEnabled) subjectInput.focus();
  }

  function closeModal(){
    modal.classList.add("hidden");
    currentCellId = null;
  }

  function createEmptyCell(){
    return {
      subject: "",
      room: "",
      time: "",
      assignments: new Array(ASSIGNMENT_COUNT).fill(false)
    };
  }

  function buildAssignments(arr){
    // モーダル内にだけチェックボックスを生成（課題はコマをクリックして初めて表示）
    assignmentsGrid.innerHTML = "";
    for(let i=0;i<ASSIGNMENT_COUNT;i++){
      const id = `as_${i+1}`;
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      cb.checked = !!arr[i];
      cb.dataset.index = i;
      // 課題は閲覧モードでも操作できる（課題の完了をつけるため）
      cb.addEventListener("change", () => {
        if(!currentCellId) return;
        const cell = store[currentCellId] || createEmptyCell();
        cell.assignments = cell.assignments || new Array(ASSIGNMENT_COUNT).fill(false);
        cell.assignments[i] = cb.checked;
        store[currentCellId] = cell;
        saveData();
        // セル表示（インジケータや科目名の有無）に影響する場合があるので再描画
        renderCell(currentCellId);
      });
      const span = document.createElement("span");
      span.textContent = `課題 ${i+1}`;
      label.appendChild(cb);
      label.appendChild(span);
      assignmentsGrid.appendChild(label);
    }
  }

  function handleSave(){
    if(!currentCellId) return;
    const subject = subjectInput.value.trim();
    const room = roomInput.value.trim();
    const time = timeInput.value.trim();
    const assignmentChecks = Array.from(assignmentsGrid.querySelectorAll("input[type=checkbox]")).map(cb => cb.checked);
    const cell = {
      subject, room, time,
      assignments: assignmentChecks
    };
    const hasContent = subject || room || time || assignmentChecks.some(Boolean);
    if(hasContent){
      store[currentCellId] = cell;
    }else{
      delete store[currentCellId];
    }
    saveData();
    renderCell(currentCellId);
    closeModal();
  }

  function handleDelete(){
    if(!currentCellId) return;
    if(!confirm("このコマの内容を削除しますか？")) return;
    delete store[currentCellId];
    saveData();
    renderCell(currentCellId);
    closeModal();
  }

  function handleClearAll(){
    if(!confirm("保存されている全てのデータを消去します。よろしいですか？")) return;
    store = {};
    settings = { bgColor: "#ffffff" };
    saveData();
    saveSettings();
    bgPicker.value = settings.bgColor;
    applyBgColor();
    renderAll();
  }

  // 起動
  init();

})();
