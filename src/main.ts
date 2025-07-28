import './style.css';
import { App } from './app';

/**
 * Main application entry point.
 * This script runs when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Instantiate the main application class to start the visualizer.
    // The VisualizerApp constructor handles all setup and initialization.
    new App();
  } catch (error) {
    // Global error handler for any critical initialization failures.
    console.error("Failed to initialize the visualizer application:", error);
    // Optionally, display a user-friendly error message on the page.
    document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: red;">
                <h1>Application Error</h1>
                <p>Could not start the complex function visualizer. Please check the console for details.</p>
            </div>
        `;
  }
});
