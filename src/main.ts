import './style.css';
import { App } from './app';

/**
 * Main application entry point.
 * This script runs when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (error) {
    console.error("Failed to initialize the visualizer application:", error);
    document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: red;">
                <h1>Application Error</h1>
                <p>Could not start the complex function visualizer. Please check the console for details.</p>
            </div>
        `;
  }
});
