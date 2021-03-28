import App from './App.svelte';
import autoAdjustWindowSize from './utils/autoAdjustWindowSize';

autoAdjustWindowSize.start();

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;