/**
 * jspsych-webgazer-calibration
 * a jspsych plugin for WebGazer calibration
 *
 * Onur Ferhat
 *
 */
jsPsych.plugins['webgazer-calibration'] = (function() {

    var plugin = {};
    var calibration_tries = 1;
    var precision_measurements = [];
    var trial_info = null;
    var plugin_ref = null;

    var points_calibrated = 0;
    var calibration_points = {};

    plugin.info = {
        name: 'webgazer-calibration',
        description: '',
        parameters: {
            continue_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Continue button label',
                default: 'Continue',
                description: 'The text that appears on the "Continue" buttons.'
            },
            calibrate_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibrate button label',
                default: 'Calibrate',
                description: 'The text that appears on the "Calibrate" buttons.'
            },
            restart_calibration_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Restart calibration button label',
                default: 'Restart',
                description: 'The text that appears on the "Restart" buttons.'
            },
            leave_experiment_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Leave experiment button label',
                default: 'Leave Experiment',
                description: 'The text that appears on the "Leave Experiment" button.'
            },
            calibration_successful_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Text for the calibration successful message',
                default: 'Calibration successful!',
                description: 'The text that appears on the "Calibration successful" message.'
            },
            calibration_failed_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Text for the calibration failed message',
                default: 'Calibration failed! Please try again, without moving your head.',
                description: 'The text that appears on the "Calibration failed" message.'
            },
            calibration_max_retries_reached_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Text for the calibration max retries reached message',
                default: 'The calibration was not successful in {} retries. The experiment has finished.',
                description: 'The text that appears on the "Calibration max retries reached" message.'
            },
            debug_mode: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Debug mode',
                default: false,
                description: 'Whether to show debug information (camera frame, face tracking, gaze estimation) on the screen.'
            },
            skip_if_calibrated: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Skip if already calibrated',
                default: false,
                description: 'Whether to skip calibration if the system is already calibrated.'
            },
            instruction_title: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibration instruction title',
                default: 'Calibration',
                description: 'Title for the calibration popup.'
            },
            instruction_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibration instruction text',
                default: 'Please click on each of the 9 points on the screen. You must click on each point 5 times till it goes yellow. This will calibrate your eye movements.',
                description: 'Text content for the calibration popup.'
            },
            instruction_help_image: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Calibration instruction helper image',
                default: null,
                description: 'Path to the image which contains calibration instructions'
            },
            instruction_help_calibrate_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibration instruction helper modal "Calibrate" button label',
                default: 'Calibrate',
                description: 'The label for the button which appears in the instruction helper modal.'
            },
            accuracy_title: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibration accuracy measurement instruction title',
                default: 'Calculating measurement',
                description: 'Title for the calibration accuracy measurement popup.'
            },
            accuracy_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Calibration accuracy measurement instruction text',
                default: "Please don't move your mouse & stare at the middle dot for the next 5 seconds. This will allow us to calculate the accuracy of our predictions.",
                description: 'Text content for the calibration accuracy measurement popup.'
            },
            minimum_calibration_accuracy: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Minimum required accuracy for the calibration',
                default: 50,
                description: 'The minimum accuracy the calibration should have to let the user continue with the experiment. If the measure was lower than this value, the calibration will be repeated.'
            },
            maximum_tries: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Maximum number of calibration retries',
                default: 3,
                description: 'The maximum number of times the calibration can be repeated. If the subject still cannot achieve the required calibration, the experiment will be terminated.'
            },
            should_calibrate_only_if_necessary: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Should calibrate only if necessary',
                default: false,
                description: 'Will start with validation, and will request recalibration only if accuracy is below threshold. Default is false.'
            },
        }
    }

    plugin.trial = function(display_element, trial) {
        trial_info = trial;
        plugin_ref = this;

        if(trial_info.skip_if_calibrated && window.is_calibrated) {
            console.log("ALREADY CALIBRATED, SKIPPING");
            jsPsych.finishTrial({
                "already_calibrated": true
            });
            return;
        }

        var html = `<style>
body {
    min-width:600px!important;
}

/* Video Feed Styling */
#overlay {
    z-index: 1;
}

/* Calibration button styling */
.Calibration{
    width: 30px;
    height: 30px;
    -webkit-border-radius: 30px;
    -moz-border-radius: 30px;
    border-radius: 30px;
    background-color: red;
    opacity: 0.2;
    border-color: black;
    border-style: solid;
    position:fixed;
    z-index: 999;
}

/* Calibration point position */
#Pt1{
    top: 3vw;
    left:3vw;
}
#Pt2{
    top: 3vw;
    left:50vw;
}
#Pt3{
    top: 3vw;
    right:3vw;
}
#Pt4{
    top:50vh;
    left:3vw;
}
#Pt5{
    top: 50vh;
    left: 50vw;
}
#Pt6{
    top: 50vh;
    right:3vw;
}
#Pt7{
    bottom:3vw;
    left: 3vw;
}
#Pt8{
    bottom:3vw;
    left:50vw;
}
#Pt9{
    bottom:3vw;
    right:3vw;
}
button {
    border-radius: 4px;
}
        </style>
        <canvas id="plotting_canvas" width="50" height="50" style="display: none;"></canvas>

        <!-- Calibration points -->
        <div class="calibrationDiv">
            <input type="button" class="Calibration" id="Pt1"></input>
            <input type="button" class="Calibration" id="Pt2"></input>
            <input type="button" class="Calibration" id="Pt3"></input>
            <input type="button" class="Calibration" id="Pt4"></input>
            <input type="button" class="Calibration" id="Pt5"></input>
            <input type="button" class="Calibration" id="Pt6"></input>
            <input type="button" class="Calibration" id="Pt7"></input>
            <input type="button" class="Calibration" id="Pt8"></input>
            <input type="button" class="Calibration" id="Pt9"></input>
        </div>
        `
        display_element.innerHTML = html;

        // Start the webgazer
        if(window.webgazer_initialized !== true) {
            webgazer.showVideo(trial.debug_mode);
            webgazer.showFaceOverlay(trial.debug_mode);
            webgazer.showPredictionPoints(trial.debug_mode);
            webgazer.showFaceFeedbackBox(trial.debug_mode);
            webgazer.begin();
            window.webgazer_initialized = true;
        }

        plugin_ref.initCalibration();
    };

    // Initialize calibration components
    plugin.initCalibration = function() {
        calibration_tries = 1;
        plugin_ref.hideCalibrationPoints();
        if (trial_info.should_calibrate_only_if_necessary) {
            plugin_ref.startValidation();
        } else if (trial_info.instruction_help_image) {
            plugin_ref.dialog({
                title: trial_info.instruction_title,
                imageUrl: trial_info.instruction_help_image,
                confirm: trial_info.calibrate_button_label
            }).then((result) => {
                plugin_ref.restartCalibration();
            });
        }
        

        // When a calibration target is clicked
        $(".Calibration").click(function() {
            var id = $(this).attr('id');

            // Increment the number of clicks for this calibration target
            if (!calibration_points[id]) {
                calibration_points[id] = 0;
            }
            calibration_points[id]++; 

            if (calibration_points[id] == 5) {
                // Turn to yellow after 5 clicks and disable button
                $(this).css('background-color', 'yellow');
                $(this).prop('disabled', true);
                points_calibrated++;
            } else if (calibration_points[id] < 5) {
                // Gradually increase the opacity of calibration points when click to give some indication to user.
                var opacity = 0.2 * calibration_points[id] + 0.2;
                $(this).css('opacity', opacity);
            }

            // Show the middle calibration point after all other points have been clicked.
            if (points_calibrated == 8) {
                $("#Pt5").show();
            }

            // Last point is calibrated
            if (points_calibrated >= 9) {
                plugin_ref.startValidation();
            }
        });


        if (!trial_info.instruction_help_image) {
            plugin_ref.restartCalibration();
        }
    }

    /**
     * Restart the calibration process by clearing the local storage and reseting the calibration point
     */
    plugin.restartCalibration = function(show_instructions = true) {
        webgazer.clearData();
        plugin_ref.clearCalibration();
        plugin_ref.hideCalibrationPoints();
        if (show_instructions) {
            plugin_ref.popUpInstruction();
        }
        plugin_ref.showInitialCalibrationPoints();
    }

    plugin.startValidation = function() {
        //Hide all calibrations except the one in the center
        plugin_ref.hideCalibrationPoints();
        $("#Pt5").css('background-color', 'yellow');
        $("#Pt5").prop('disabled', true);
        $("#Pt5").css('opacity', 1);
        $("#Pt5").show();

        // Notification for the measurement process
        plugin_ref.dialog({
            title: trial_info.accuracy_title,
            text: trial_info.accuracy_text,
            confirm: trial_info.continue_button_label,
        }).then((result) => {
            // Start storing the prediction points in WebGazer for 5 seconds
            startStoringPoints();

            sleep(5000).then(() => {
                // Stop storing the prediction points
                stopStoringPoints();

                // Retrieve the stored points and calculate precision
                var past50 = webgazer.getStoredPoints();
                window.precision_measurement = calculatePrecision(past50);
                precision_measurements.push(window.precision_measurement);

                // For the debug mode, give the option to recalibrate.
                if (trial_info.debug_mode) {
                    plugin_ref.dialog({
                        title: "Your accuracy measure is " + window.precision_measurement + "%",
                        confirm: trial_info.continue_button_label,
                        cancel: trial_info.restart_calibration_button_label
                    }).then((result) => {
                        if (result.isConfirmed) {
                            //clear the calibration & hide the last middle button
                            plugin_ref.hideCalibrationPoints();
                            plugin_ref.finishCalibration();
                        } else {
                            plugin_ref.restartCalibration(false);
                        }
                    });
                }
                // Otherwise, compare with the minimum score and recalibrate if necessary
                else {
                    // Precision is high enough
                    if (window.precision_measurement >= trial_info.minimum_calibration_accuracy) {
                        plugin_ref.dialog({
                            title: trial_info.calibration_successful_text,
                            confirm: trial_info.continue_button_label,
                        }).then((result) => {
                            // Clear the calibration & hide the last middle button
                            plugin_ref.hideCalibrationPoints();
                            plugin_ref.finishCalibration();
                        });
                    }
                    // Precision is not very good, but we can still retry
                    else if (calibration_tries < trial_info.maximum_tries) {
                        plugin_ref.dialog({
                            title: trial_info.calibration_failed_text,
                            confirm: trial_info.restart_calibration_button_label
                        }).then((result) => {
                            plugin_ref.restartCalibration(false);
                            calibration_tries++;
                        });
                    }
                    // Precision is not very good, and retry limit exceeded
                    else {
                        plugin_ref.dialog({
                            title: trial_info.calibration_max_retries_reached_text.replace("{}", trial_info.maximum_tries),
                            confirm: trial_info.leave_experiment_button_label,
                        }).then((result) => {
                            jsPsych.endExperiment("Could not calibrate in " + trial_info.maximum_tries + ". Precision measurements for calibrations: " + precision_measurements);
                        });
                    }

                }
            });
        });
    }

    plugin.finishCalibration = function() {
        window.is_calibrated = true;
        // save data
        var trial_data = {
            "calibration_precision": window.precision_measurement
        };
        // next trial
        jsPsych.finishTrial(trial_data);
    }



    /**
     * This function clears the calibration buttons memory
     */
    plugin.clearCalibration = function() {
        $(".Calibration").css('background-color', 'red');
        $(".Calibration").css('opacity', 0.2);
        $(".Calibration").prop('disabled', false);

        calibration_points = {};
        points_calibrated = 0;
        precision_measurements = [];
    }

    plugin.dialog = function(options) {
        if (options === undefined) options = {};
        if (options.title === undefined) options.title = "";
        if (options.text === undefined) options.text = null;
        if (options.imageUrl === undefined) options.imageUrl = null;
        if (options.confirm === undefined) options.confirm = "OK";
        if (options.cancel === undefined) options.cancel = false;

        return Swal.fire({
            title: options.title,
            text: options.text,
            imageUrl: options.imageUrl,
            width: 600,
            allowOutsideClick: false,
            showCancelButton: (options.cancel == false) ? false : true, 
            cancelButtonText: options.cancel,
            confirmButtonText: options.confirm,
        })
    }


    /**
     * Show the instruction of using calibration at the start up screen.
     */
    plugin.popUpInstruction = function() {
        plugin_ref.hideCalibrationPoints();
        plugin_ref.dialog({
            title: trial_info.instruction_title,
            text: trial_info.instruction_text,
        }).then((result) => {
            plugin_ref.showInitialCalibrationPoints();
        });
    }


    /**
     * Show the Calibration Points
     */
    plugin.showInitialCalibrationPoints = function() {
        $(".Calibration").show();
        $("#Pt5").hide(); // initially hides the middle button
    }


    /**
     * Hide the calibration points.
     */
    plugin.hideCalibrationPoints = function() {
        $(".Calibration").hide();
        // Clears the canvas
        var canvas = document.getElementById("plotting_canvas");
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    // sleep function because JS doesn't have one, sourced from http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    /*
     * This function calculates a measurement for how precise 
     * the eye tracker currently is which is displayed to the user
     */
    function calculatePrecision(past50Array) {
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();

        // Retrieve the last 50 gaze prediction points
        var x50 = past50Array[0];
        var y50 = past50Array[1];

        // Calculate the position of the point the user is staring at
        var staringPointX = windowWidth / 2;
        var staringPointY = windowHeight / 2;

        var precisionPercentages = new Array(50);
        calculatePrecisionPercentages(precisionPercentages, windowHeight, x50, y50, staringPointX, staringPointY);
        var precision = calculateAverage(precisionPercentages);

        // Return the precision measurement as a rounded percentage
        return Math.round(precision);
    };

    /*
     * Calculate percentage accuracy for each prediction based on distance of
     * the prediction point from the centre point (uses the window height as
     * lower threshold 0%)
     */
    function calculatePrecisionPercentages(precisionPercentages, windowHeight, x50, y50, staringPointX, staringPointY) {
        for (x = 0; x < 50; x++) {
            // Calculate distance between each prediction and staring point
            var xDiff = staringPointX - x50[x];
            var yDiff = staringPointY - y50[x];
            var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));

            // Calculate precision percentage
            var halfWindowHeight = windowHeight / 2;
            var precision = 0;
            if (distance <= halfWindowHeight && distance > -1) {
                precision = 100 - (distance / halfWindowHeight * 100);
            } else if (distance > halfWindowHeight) {
                precision = 0;
            } else if (distance > -1) {
                precision = 100;
            }

            // Store the precision
            precisionPercentages[x] = precision;
        }
    }

    /*
     * Calculates the average of all precision percentages calculated
     */
    function calculateAverage(precisionPercentages) {
        var precision = 0;
        for (x = 0; x < 50; x++) {
            precision += precisionPercentages[x];
        }
        precision = precision / 50;
        return precision;
    }

    /*
     * Sets store_points to true, so all the occuring prediction
     * points are stored
     */
    function startStoringPoints() {
        webgazer.params.storingPoints = true;
    }

    /*
     * Sets store_points to false, so prediction points aren't
     * stored any more
     */
    function stopStoringPoints() {
        webgazer.params.storingPoints = false;
    }

    return plugin;
})();