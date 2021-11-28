import App from './App.svelte';
if (!location.search.includes('plugin=1')) {
	const app = new App({
		target: document.body,
	});

	// @ts-ignore
	window.app = app;
}