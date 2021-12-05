<script lang="ts">
import { createEventDispatcher } from 'svelte'

export let showBack: boolean = false;
export let value: string = '';
export let debounce: boolean = false;
export let placeholder: string = '请搜索...'

let inputValue = ''

let timeout = null;
$: {
  if (debounce) {
    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      value = inputValue
    }, 200)
  } else {
    value = inputValue
  }
}

const dispatch = createEventDispatcher()

const onNavigateBackClicked = () => {
  dispatch('back')
}

const keydownHandler = (e) => {
  if (e.target.value === '' && e.keyCode === 8 && showBack) {
    dispatch('back')
  }
}

</script>
<div class="input-bar">
  <div class="input-bar-wrapper">
    {#if showBack}
    <img src="../assets/arrow-right.png" alt=""
      on:click={onNavigateBackClicked}
      class="navigate-back">
    {/if}
    <input type="text"
      placeholder={placeholder}
      id="main-input"
      autofocus
      value={inputValue}
      on:keydown={keydownHandler}
      on:input/>
    <img src="logo.png" alt="" class="app-logo" draggable="false">
  </div>
</div>

<style>
  .navigate-back {
    width: 12px;
    height: 12px;
    padding: 10px;
    border-radius: 9999px;
    /* border: 1px solid #333; */
    margin-left: 8px;
    background: #ddd;
  }
  .navigate-back:hover {
    background: #ccc;
  }
  .input-bar {
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    position: relative;
    z-index: 100;
    -webkit-app-region: drag;
    background: #fff;
    border-bottom: 1px solid #eee;
    box-sizing: border-box;
  }
  .input-bar .input-bar-wrapper {
    /* position: absolute; */
    height: 48px;
    /* top: 36px; */
    /* left: 0; */
    /* right: 0; */
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