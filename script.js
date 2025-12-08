// シンプルな時間割アプリ
// 仕様: 月-金 x 1-6時限、各セルに科目/教室/時間 + 課題15チェック、背景色選択、localStorage 保存

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

    editToggle.addEventListener("change", () => {
      // モード切替時の反映（編集ボタンの表示など）
      // 今回はモーダル側で確認する実装なのでここは最小限
    });
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
    if(!data || (!data.subject && !data.room && !data.time)){
      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = "（空）クリックして追加";
      td.appendChild(ph);
    }else{
      const title = document.createElement("div");
      title.className = "cell-title";
      title.textContent = data.subject || "（科目なし）";
      td.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "cell-meta";
      meta.textContent = data.room || "";
      td.appendChild(meta);

      if(data.time){
        const time = document.createElement("div");
        time.className = "cell-time";
        time.textContent = data.time;
        td.appendChild(time);
      }
    }
  }

  function cellIdFor(period, col){
    return `r${period}-c${col}`;
  }

  // モーダル関連
  function openCell(cellId){
    currentCellId = cellId;
    const data = store[cellId] || createEmptyCell();
    // 画面にデータを入れる
    subjectInput.value = data.subject || "";
    roomInput.value = data.room || "";
    timeInput.value = data.time || "";
    buildAssignments(data.assignments || []);
    // 編集可否を切り替え
    const editingEnabled = editToggle.checked;
    subjectInput.disabled = !editingEnabled;
    roomInput.disabled = !editingEnabled;
    timeInput.disabled = !editingEnabled;
    saveBtn.style.display = editingEnabled ? "" : "none";
    deleteBtn.style.display = editingEnabled ? "" : "none";
    // モーダルタイトルにセル情報を追記
    const title = document.getElementById("modalTitle");
    title.textContent = `コマ編集 (${cellId})`;
    modal.classList.remove("hidden");
    // フォーカス
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
      // ただし課題ラベルの見た目は同一
      cb.addEventListener("change", () => {
        // 直接ストアに反映して保存（課題チェックは編集モードに依らず即時保存）
        if(!currentCellId) return;
        const cell = store[currentCellId] || createEmptyCell();
        cell.assignments = cell.assignments || new Array(ASSIGNMENT_COUNT).fill(false);
        cell.assignments[i] = cb.checked;
        store[currentCellId] = cell;
        saveData();
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
    // assignments: collect current checkbox states
    const assignmentChecks = Array.from(assignmentsGrid.querySelectorAll("input[type=checkbox]")).map(cb => cb.checked);
    const cell = {
      subject, room, time,
      assignments: assignmentChecks
    };
    // 若すべて空（subject, room, time 空かつ全チェックfalse）なら削除扱い
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
    if(!confirm("このコマを削除しますか？")) return;
    delete store[currentCellId];
    saveData();
    renderCell(currentCellId);
    closeModal();
  }

  function handleClearAll(){
    if(!confirm("保存されている全てのデータを消去します。")) return;
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
