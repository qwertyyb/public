<div class="input-bar">
  <div class="input-bar-wrapper">
    <input type="text"
      placeholder="请搜索"
      id="main-input"
      on:input/>
    <img src="logo.png" alt="" class="app-logo" draggable="false">
  </div>
</div>

<style>
  .input-bar {
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    position: relative;
    z-index: 100;
    -webkit-app-region: drag;
    /* border-bottom: 1px solid #ddd; */
  }
  .input-bar .input-bar-wrapper {
    position: fixed;
    height: 48px;
    top: 0;
    left: 0;
    right: 0;
    /* background: #fff; */
    display: flex;
    align-items: center;
  }
  input {
    height: 42px;
    min-height: 42px;
    font-size: 28px;
    padding: 0 10px;
    width: 100%;
    box-sizing: border-box;
    outline: none;
    border: none;
    background: none;
  }
  input::placeholder {
    font-size: 20px;
    font-weight: normal;
    position: relative;
    top: -2px;
  }

  .app-logo {
    width: 36px;
    height: auto;
    margin-right: 12px;
    cursor: pointer;
  }
</style>