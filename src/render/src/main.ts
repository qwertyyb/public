import App from './App.svelte';
import ListPreview from './components/plugin/ListPreview.svelte';
if (!location.search.includes('plugin=1')) {
	const app = new App({
		target: document.body,
	});

	// @ts-ignore
	window.app = app;
} else {
	const app = new ListPreview({
		target: document.body,
	})
	//@ts-ignore
	window.app = app;
}