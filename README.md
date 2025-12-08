<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>時間割表アプリ</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <h1>時間割表</h1>
    <div class="controls">
      <label>
        編集モード
        <input id="editToggle" type="checkbox" />
      </label>
      <label>
        背景色
        <input id="bgColorPicker" type="color" value="#ffffff" />
      </label>
      <button id="clearAll">全消去</button>
    </div>
  </header>

  <main>
    <div class="table-wrap">
      <table id="timetable" aria-label="時間割表"></table>
    </div>
  </main>

  <!-- モーダル -->
  <div id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-content">
      <h2 id="modalTitle">コマ編集</h2>
      <form id="cellForm">
        <div class="form-row">
          <label>科目名: <input type="text" id="subject" /></label>
        </div>
        <div class="form-row">
          <label>教室: <input type="text" id="room" /></label>
        </div>
        <div class="form-row">
          <label>講義時間: <input type="text" id="time" placeholder="例) 10:00-11:30" /></label>
        </div>

        <fieldset class="assignments">
          <legend>課題（15）</legend>
          <div id="assignmentsGrid" class="assignments-grid"></div>
        </fieldset>

        <div class="modal-actions">
          <button type="button" id="saveBtn">保存</button>
          <button type="button" id="closeBtn">閉じる</button>
          <button type="button" id="deleteBtn" class="danger">削除</button>
        </div>
      </form>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
