// assignments.html のスクリプト：クエリの cell を読んで localStorage を編集・保存する
(function(){
  const DAYS = ["月","火","水","木","金"];
  const ASSIGNMENT_COUNT = 15;
  const STORAGE_KEY = "timetableData_v1";

  // DOM
  const cellLabel = document.getElementById("cellLabel");
  const pageTitle = document.getElementById("pageTitle");
  const subjectInput = document.getElementById("subject");
  const roomInput = document.getElementById("room");
  const timeInput = document.getElementById("time");
  const assignmentsGrid = document.getElementById("assignmentsGrid");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  let store = {};
  let currentCellId = null;

  function init(){
    loadData();
    currentCellId = getQueryCell();
    if(!currentCellId){
      alert("cell パラメータがありません。index.html に戻ります。");
      window.location.href = "index.html";
      return;
    }
    cellLabel.textContent = humanLabel(currentCellId);
    pageTitle.textContent = `課題編集 (${humanLabel(currentCellId)})`;

    const data = store[currentCellId] || createEmptyCell();
    subjectInput.value = data.subject || "";
    roomInput.value = data.room || "";
    timeInput.value = data.time || "";

    buildAssignments(data.assignments || []);

    saveBtn.addEventListener("click", handleSave);
    deleteBtn.addEventListener("click", handleDelete);
  }

  function getQueryCell(){
    const params = new URLSearchParams(location.search);
    return params.get("cell");
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

  function humanLabel(cellId){
    const m = String(cellId).match(/^r(\d+)-c(\d+)$/);
    if(!m) return cellId;
    const period = m[1];
    const col = parseInt(m[2], 10);
    const day = DAYS[col - 1] || `c${col}`;
    return `${day}${period}`;
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
      const span = document.createElement("span");
      span.textContent = `課題 ${i+1}`;
      label.appendChild(cb);
      label.appendChild(span);
      assignmentsGrid.appendChild(label);
    }
  }

  function handleSave(){
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
    // 保存後 index に戻る
    window.location.href = "index.html";
  }

  function handleDelete(){
    if(!confirm("このコマの内容を削除しますか？")) return;
    delete store[currentCellId];
    saveData();
    window.location.href = "index.html";
  }

  init();
})();
