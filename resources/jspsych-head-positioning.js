/**
 * jspsych-head-positioning
 * a jspsych plugin for webcam head positioning
 *
 * Onur Ferhat
 *
 */
jsPsych.plugins['head-positioning'] = (function() {

    var plugin = {};
    var trial_info = null;
    var plugin_ref = null;

    plugin.info = {
        name: 'head-positioning',
        description: '',
        parameters: {
            continue_button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Continue button label',
                default: 'Continue',
                description: 'The text that appears on the "Continue" buttons.'
            },
            instruction_title: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Head positioning instruction title',
                default: 'Positioning',
                description: 'Title for the head positioning popup.'
            },
            instruction_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Head positioning instruction text',
                default: 'Adjust your camera location (if an external webcam is used) and/or your position so that your face is inside the rectangle.',
                description: 'Text content for the head positioning popup.'
            },
        }
    }

    plugin.trial = function(display_element, trial) {
        trial_info = trial;
        plugin_ref = this;

        var html = `<style>
body {
    min-width:600px!important;
}

/* Video Feed Styling */
#overlay {
    z-index: 1;
}

#webgazerVideoContainer {
    margin-top: 40px;
    margin-bottom: 500px;
}

        </style>
        <canvas id="plotting_canvas" width="0" height="0"></canvas><br/>
        <p style="width: 40vw; margin-top: 150px;">`+trial_info.instruction_text+`</p><br/>
        <input type="submit" id="button-continue" class="jspsych-btn" value="`+trial_info.continue_button_label+`"></input>`
        display_element.innerHTML = html;

        // Start the webgazer
        webgazer.showVideo(true);
        webgazer.showFaceOverlay(false);
        webgazer.showPredictionPoints(false);
        webgazer.showFaceFeedbackBox(true);
        // Clear top & left attributes so that the div is centered on the page
        webgazer.videoContainerTop(null);
        webgazer.videoContainerLeft(null);
        webgazer.setVideoViewerSize(480, 360);
        webgazer.begin();
        
        var startTime = performance.now();

        $("#button-continue").click(function() {
          var endTime = performance.now();
          var response_time = endTime - startTime;

          // save data
          var trialdata = {
            "rt": response_time
          };

          display_element.innerHTML = '';
          $("#webgazerVideoContainer").hide();

          // next trial
          jsPsych.finishTrial(trialdata);
        });
    };

    return plugin;
})();
