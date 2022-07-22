"use strict";

// Select all CSS-animated elements from the DOM
const background_animates = document.querySelectorAll(".background_animate");
const foreground_animates = document.querySelectorAll(".foreground_animate");

// Select the container for the pipes from the DOM
const pipes_container = document.querySelector(".pipes");

// Select the button elements from the DOM
const flap_button = document.querySelector(".flap_btn");
const start_button = document.querySelector(".start_btn");

// Select the score elements from the DOM
const score_title = document.querySelector(".score_title");
const high_score_text = document.querySelector(".highscore");

// Select the bird element from the DOM
const bird = document.querySelector(".bird");

// Constant numeric variables that never change
// Used for calculating positions in the update function
const pipe_gap_height = 140;
const bird_right_x = 114;
const bird_left_x = 82;
const bird_height = 24;
const pipe_width = 52;
const pipe_height = 320;

// Dynamic variables used to calculate the bird momentum,
// game scores, and pipe timer
let bird_dy = 0;
let bird_y = 228;
let last_bird_y = 228;
let high_score = 0;
let pipe_dur_count = 0;
let score = 0;
let should_update_score = false;
let has_score_incremented = false;

/**
 * This function is called after the game loop initialization but before
 * the main loop starts
 */
function begin() {
	// If the game has died, revive (reset) the game loop
	if (has_died) revive();

	// Update DOM buttons to the in-game state
	toggle_buttons(true);
	toggle_animations(true);
}

/**
 * This update function is called every tick of the game loop. This function
 * should not draw or modify DOM elements, only update JS-only values
 * @param {number} delta the delta value used to calculate the new positions
 */
function update(delta) {
	// Update the last position
	last_bird_y = bird_y;

	// Apply gravity force to the bird velocity
	bird_dy += 0.05;

	// Update the current position of the bird
	bird_y = last_bird_y + bird_dy * delta;

	// Add a pipe every 50 ticks
	if (pipe_dur_count > 50) {
		create_pipe();
		pipe_dur_count = 0;
	}

	// Get all the current pipe elements
	const pipes = document.querySelectorAll(".pipe");
	pipes.forEach((p) => {
		// If the pipe has left the screen, delete it
		if (p.x + 52 < 0) {
			// One exception to the update function, remove unseen pipes
			// so we don't waste time updating pipes that will be deleted soon
			p.remove();
			return;
		}

		// Update each pipe's position
		p.last_x = p.x;
		p.x = +p.last_x - 0.1333 * delta;
	});

	// If at least one pipe exists
	// We only need to check if the bird hit the first pipe since it can
	// only fly through one at a time
	if (pipes && pipes[0]) {
		// Is the bird within the boundaries of a pipe?
		if (
			// If the left side of the pipe is less than or equal to
			// (touching or overlapping) the bird's right (front) side
			pipes[0].x - pipe_width / 2 <= bird_left_x &&
			// If the right side of the pipe is less than or equal to
			// the bird's left (back) side
			pipes[0].x + pipe_width + pipe_width / 2 >= bird_right_x
		) {
			// Is the bird inside the clearing of the pipes?
			if (
				// Is the bird below the bottom of the top pipe?
				bird_y > pipes[0].y_top &&
				// Is the bottom of the bird above the top of the bottom pipe?
				bird_y + bird_height < pipes[0].y_top + pipe_gap_height + 10
			) {
				// Has the score not updated? If so, update it
				if (!has_score_incremented) {
					score++;
					has_score_incremented = true;
				}
			} else {
				// Bird has hit a pipe!
				reset();
			}

			// Bird has left a pipe boundary, update score calculating variables
		} else {
			has_score_incremented = false;
			should_update_score = true;
		}
	}

	// If the bird touches the ground, reset the game
	if (bird_y > 480) {
		bird_y = 469;
		bird_dy = 0;
		reset();
	}

	// If bird hits the top, keep him below 0 and remove velocity
	else if (bird_y < 0) {
		bird_y = 0;
		bird_dy = 0;
	}

	// Update the pipe duration count
	pipe_dur_count++;
}

/**
 * This draw function is called when drawing or updating anything visual
 * @param {number} interp The interpolation value provided by the game loop
 */
function draw(interp) {
	apply_element_force(last_bird_y + (bird_y - last_bird_y) * interp, bird);

	const pipes = document.querySelectorAll(".pipe");
	pipes.forEach((p) =>
		apply_element_force(+p.last_x + (p.x - +p.last_x) * interp, p, "left"),
	);

	if (should_update_score) {
		score_title.textContent = "Score: " + score;
		should_update_score = false;
	}
}

/**
 * This end function is called by the game loop when the loop exits
 */
function end() {
	toggle_buttons(false);
	toggle_animations(false);
}

/**
 * The flap function called when the flap button is clicked
 */
function flap() {
	bird_dy = -0.5;
}

/**
 *
 * @param {number} value the force to apply
 * @param {HTMLElement} element the element to apply the force to
 * @param {("top"|"bottom"|"left"|"right")} type the direction to apply the force to
 */
function apply_element_force(value, element, type = "top") {
	// eg. element.style.left = "10px"
	element.style[type] = value + "px";
}

/**
 * Create a new pipe. It spawns on the right side of the screen
 * out of view. Initialize some custom properties to use for later.
 * Set styles on the pipe and append it to a container.
 */
function create_pipe() {
	const start_x = 400;
	const max_height = 150;
	const min_height = 0;

	const pipe_variable_height =
		Math.floor(Math.random() * max_height - min_height) + min_height;

	const pipe = document.createElement("div");
	// Add pipe class
	pipe.classList.add("pipe");
	// Add custom properties to keep track of positions
	pipe.last_x = start_x;
	pipe.x = start_x;
	pipe.y_top = pipe_variable_height + max_height - 20;
	// Set the initial css positions
	pipe.style.top = pipe_variable_height - max_height - 40 + "px";
	pipe.style.left = start_x + "px";

	pipes_container.appendChild(pipe);
}

/**
 * Delete all existing pipes
 */
function reset_pipes() {
	const pipes = document.querySelectorAll(".pipe");
	pipes.forEach((e) => e.remove());
}

/**
 * Update the DOM buttons styles to match the game's state
 * @param {boolean} has_started has the game started?
 */
function toggle_buttons(has_started) {
	flap_button.style.display = has_started ? "block" : "none";
	start_button.style.display = has_started ? "none" : "block";
}

/**
 * Update the DOM elements animation state
 * @param {boolean} toggle_on turn animations on or off
 */
function toggle_animations(toggle_on) {
	const state = toggle_on ? "running" : "paused";
	background_animates.forEach((e) => (e.style.animationPlayState = state));
	foreground_animates.forEach((e) => (e.style.animationPlayState = state));
}

/**
 * Reset the entire game to it's starting state
 * and update the high score
 */
function reset() {
	// die() will stop the game loop
	die();
	reset_pipes();

	// Store the highest score
	high_score = score > high_score ? score : high_score;

	// Reset common variables
	score = 0;
	bird_dy = 0;
	bird_y = 228;
	last_bird_y = 228;

	// Update the score text in the document
	score_title.textContent = "";
	high_score_text.textContent = "Highscore: " + high_score;
}
