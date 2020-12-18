/**
 * jspsych-aspect2-experiment
 * a jspsych plugin for the English Aspect experiment
 *
 * Onur Ferhat (modified by Myrte Vos)
 *
 */

 jsPsych.plugins['aspect2-experiment'] = (function() {

  var plugin = {};
  var trial_info = null;
  var plugin_ref = null;

  var preamble_context = null;
  var audio_context = null;
  var preamble_source = null;
  var audio_source = null;
  var preamble_buffer = null;
  var audio_buffer = null;

  var start_time = null;
  var preamble_onset = null;
  var audio_onset = null;
  var audio_offset = null;

  var display_element_ref = null;
  var l_img_bbox = null;
  var r_img_bbox = null;
  var choice = null;

  // function to round numbers
  var round = function(number, digits=2) {
    var power_of_10 = Math.pow(10, digits);
    return Math.round(number * power_of_10) / power_of_10;
  }

  // plugin parameter definitions
  plugin.info = {
    name: 'aspect2-experiment',
    description: '',
    parameters: {
      left: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Left',
        default: null,
        description: 'Path to the image to show on the left side'
      },
      right: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Right',
        default: null,
        description: 'Path to the image to show on the right side'
      },
      preamble: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Preamble Audio',
        default: null,
        description: 'Path to the preamble to play during the experiment'
      },
      audio: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Audio',
        default: null,
        description: 'Path to the audio to play during the experiment'
      },
      target_filler: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target or filler',
        default: '',
        description: 'Whether a trial is experimental or a filler'
      },
      target_side: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target Side',
        default: '',
        description: 'Side (L/R) on which target is presented'
      },
      imp_side: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Imperfective Side',
        default: '',
        description: 'Side (L/R) on which imperfective picture is presented, if at all'
      },
      target_verb: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target Verb',
        default: '',
        description: 'Target verb'
      },
      target_aspect: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target Aspect',
        default: '',
        description: 'Aspect of the target picture'
      },
      competitor_verb: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Competitor Verb',
        default: '',
        description: 'Competitor verb'
      },
      competitor_aspect: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Competitor Aspect',
        default: '',
        description: 'Competitor aspect'
      },
      was: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Presence of "Was"',
        default: true,
        description: 'Whether or not the sentence contains the word "was"'
      },
      list_number: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'List Number',
        default: 0,
        description: 'List number'
      },
      ok_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'OK button label',
        default: 'OK',
        description: 'The text that appears on the "OK" button.'
      },
      calibration_lost_dialog_title: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Calibration lost dialog title',
        default: 'Calibration Lost',
        description: 'The title of the "Calibration Lost" dialog.'
      },
      calibration_lost_dialog_text: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Calibration lost dialog text',
        default: 'We lost your face in the webcam video stream. Please sit in front of the monitor, and make sure your face is centered in the webcam video stream. The experiment will continue with a new calibration.',
        description: 'The text of the "Calibration Lost" dialog.'
      },
    }
  }

  plugin.load_audio = function() {
    // setup preamble audio playback
    preamble_context = jsPsych.pluginAPI.audioContext();
    if (preamble_context !== null) {
        preamble_source = preamble_context.createBufferSource();
        preamble_source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial_info.preamble + '.mp3');
        preamble_source.connect(preamble_context.destination);
    } else {
        preamble_buffer = jsPsych.pluginAPI.getAudioBuffer(trial_info.preamble + '.mp3');
        preamble_buffer.currentTime = 0;
    };
    
    // setup trial audio playback
    audio_context = jsPsych.pluginAPI.audioContext();
    if (audio_context !== null) {
        audio_source = audio_context.createBufferSource();
        audio_source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial_info.audio + '.mp3');
        audio_source.connect(audio_context.destination);
    } else {
        audio_buffer = jsPsych.pluginAPI.getAudioBuffer(trial_info.audio + '.mp3');
        audio_buffer.currentTime = 0;
    }
  
    /* Setup preamble_ended event <- THIS BIT IS FURTHER DOWN NOW
    var on_preamble_ended = function() {
      show_trial();
    }

  if(preamble_context !== null){
      preamble_source.onended = on_preamble_ended;
  } else {
      preamble_buffer.addEventListener('ended', on_preamble_ended);
  } */

  // Setup audio_ended event
  var on_audio_ended = function() {
    $("#hidemouse").css('cursor', 'auto');
    audio_offset = round((performance.now() / 1000) - start_time, 3);
    if(window.is_calibrated) {      
       window.audio_ended = true;
       if(choice !== null) {
        plugin_ref.end_trial();
      }
     }
   }

  if(audio_context !== null){
    audio_source.onended = on_audio_ended;
  } else {
    audio_buffer.addEventListener('ended', on_audio_ended);
  }
}

  // functions to start audio playback
  plugin.start_preamble = function() {
    // start preamble
    if(preamble_context !== null){
      preamble_source.start(0);
      preamble_onset = round((performance.now() / 1000) - start_time, 3);
    } else {
      preamble_buffer.play();
    }
  }

  plugin.start_audio = function() {
    // start audio
    if(audio_context !== null){
      audio_source.start(0);
      audio_onset = round((performance.now() / 1000) - start_time, 3);
    } else {
      audio_buffer.play();
    }
  }

  // functions to stop audio playback
  plugin.stop_preamble_if_playing = function() {
    try {
        if(preamble_context !== null){
          preamble_source.stop();
        } else {
          preamble_buffer.pause();
        }
    } catch { }
  }

  plugin.stop_audio_if_playing = function() {
    try {
      if(audio_context !== null){
        audio_source.stop();
      } else {
        audio_buffer.pause();
      }
    } catch { }
  }
  
  plugin.show_content = function() {
    var show_preamble = `<style>
    body {
      min-width:600px!important;
    }

    #Pt5{
      width: 30px;
      height: 30px;
      -webkit-border-radius: 30px;
      -moz-border-radius: 30px;
      border-radius: 30px;
      background-color: yellow;
      opacity: 1;
      border-color: black;
      border-style: solid;
      position:fixed;
      z-index: 999;
      top: 50vh;
      left: 50vw;
    }

    #Pt5:hover {
    background-color: green;
    }

    </style>
    <div class="calibrationDiv">
        <input type="button" class="Calibration" id="Pt5" ></input>
    </div>`
    display_element_ref.innerHTML = show_preamble;

    //jsPsych.pluginAPI.setTimeout(function(){
    //plugin_ref.start_preamble();
    //}, 500);

    // Setup preamble_ended event
    var on_preamble_ended = function() {
      show_trial();
    }

  if(preamble_context !== null){
      preamble_source.onended = on_preamble_ended;
  } else {
      preamble_buffer.addEventListener('ended', on_preamble_ended);
  }

    var show_trial = function() {
      display_element_ref.innerHTML = `<style>
      .jspsych-content {
          max-width: 100vw;
          width: 100vw;
          height: 100vh;
          border-left: solid #cccccc 0.5vw;
          border-right: solid #cccccc 0.5vw;
          border-top: solid #cccccc 4vh;
          border-bottom: solid #cccccc 4vh;
          background-color: #cccccc;
      } 
  
      .img-fluid.selection-enabled:hover {
          box-shadow: 0px 0px 15px #666666;
          -moz-box-shadow: 0px 0px 15px #666666;
          -webkit-box-shadow: 0px 0px 15px #666666;
      }
  
      .img-fluid.selected {
         box-shadow: 0px 0px 25px #224488;
         -moz-box-shadow: 0px 0px 25px #224488;
         -webkit-box-shadow: 0px 0px 25px #224488;
      }

      #hidemouse{
        cursor: none;
      }
      </style>
      <div id="hidemouse" class="container-fluid" style="height: 100%;">
      <div class="row" style="height: 100%;">
          <div class="col-md-5 align-self-center">
              <img id="left-img" src="` + trial_info.left + `" class="img-fluid selection-enabled" alt="Left image">
          </div>
          <div class="col-md-2"></div>
          <div class="col-md-5 align-self-center">
              <img id="right-img" src="` + trial_info.right + `" class="img-fluid selection-enabled" alt="Right image">
          </div>
      </div>`;
  
      //jsPsych.pluginAPI.setTimeout(function(){
      plugin_ref.start_audio();
      //}, 1);
   

      var rect = $("#left-img")[0].getBoundingClientRect();
      l_img_bbox = {
        "top": round(rect.top), 
        "right": round(rect.left), 
        "bottom": round(rect.bottom), 
        "left": round(rect.right)
      };

      rect = $("#right-img")[0].getBoundingClientRect();
      r_img_bbox = {
        "top": round(rect.top), 
        "right": round(rect.left), 
        "bottom": round(rect.bottom), 
        "left": round(rect.right)
      };

      $(".img-fluid").removeClass("selection-enabled");
      $(".img-fluid").off('click');

      //add event listeners to trial pictures
      display_element_ref.querySelector("#left-img").addEventListener('click', function(e){
        $("#right-img").removeClass("selected");
        $("#left-img").addClass("selected");
        //$(".img-fluid").off('click');
        choice = "L";
        if(window.audio_ended) {
          plugin_ref.end_trial();
        }
      });

      display_element_ref.querySelector("#right-img").addEventListener('click', function(e){
        $("#left-img").removeClass("selected");
        $("#right-img").addClass("selected");
        //$(".img-fluid").off('click');
        choice = "R";
        if(window.audio_ended) {
          plugin_ref.end_trial();
        }
      });
    }

    // Clicking the fixation dot triggers the preamble audio and disables the dot
    $(".Calibration").click(function() {
      $("#Pt5").prop('disabled', true);
      $("#Pt5").css('opacity', 0.2);
      plugin_ref.start_preamble();
    });    
  };

  // function to end trial when it is time
  plugin.end_trial = function() {
    // Stop the gaze listener
    webgazer.clearGazeListener();
    webgazer.clearFaceLostListener();

    // kill any remaining setTimeout handlers
    jsPsych.pluginAPI.clearAllTimeouts();

    var get_stimuli_name = function(image_path) {
        var path_pieces = image_path.split("/");
        var stimuli_name = path_pieces[path_pieces.length-1];
        return stimuli_name;
    }

    // gather the data to store for the trial
    var trial_data = {
      "start_time": start_time,
      "gaze": window.gaze_points,
      "l_image": get_stimuli_name(trial_info.left),
      "l_image_bbox": l_img_bbox,
      "r_image": get_stimuli_name(trial_info.right),
      "r_image_bbox": r_img_bbox,
      "audio": {
        "audio_id": get_stimuli_name(trial_info.audio),
        "audio_onset": audio_onset,
        "audio_offset": audio_offset
      },
      "preamble": {
        "preamble_id": get_stimuli_name(trial_info.preamble),
        "preamble_onset": preamble_onset
      },
      "image_selection": {
          "selected_image": choice,
          "time": round((performance.now() / 1000) - start_time, 3)
      },
      "target_filler": trial_info.target_filler,
      "target_side": trial_info.target_side,
      "imp_side": trial_info.imp_side,
      "target_verb": trial_info.target_verb,
      "target_aspect": trial_info.target_aspect,
      "competitor_verb": trial_info.competitor_verb,
      "competitor_aspect": trial_info.competitor_aspect,
      "list_number": trial_info.list_number
    };

    // clear the display
    display_element_ref.innerHTML = '';

    // reset the choice variable
    choice = null;

    // move on to the next trial
    jsPsych.finishTrial(trial_data);
  };

  plugin.trial = function(display_element, trial) {
    trial_info = trial;
    plugin_ref = this;
    display_element_ref = display_element;
    window.last_gaze_point_time = 0;
    window.audio_ended = false;

    plugin_ref.load_audio();

    // start time
    start_time = round(performance.now() / 1000, 3);

    window.gaze_points = [];

    webgazer.clearGazeListener();
    webgazer.setGazeListener(function(data, elapsedTime) {
        var gaze_point_time = round((performance.now() / 1000) - start_time, 3);
        if (data == null) {
            return;
        }
        // If we have a duplicate gaze estimation in a very short time, skip it
        if(gaze_point_time - window.last_gaze_point_time < 0.002) {
            return;
        } 
        window.last_gaze_point_time = gaze_point_time;
        window.gaze_points.push({
            "x": data.x,
            "y": data.y,
            "mouse_x": window.mouse_pos_x,
            "mouse_y": window.mouse_pos_y,
            "time": gaze_point_time
        });
  });


  webgazer.setFaceLostListener(function(elapsedTime) {
      // Clear the listener so that the callback isn't executed several times
      webgazer.clearFaceLostListener();

      window.is_calibrated = false;
      plugin_ref.stop_preamble_if_playing();
      plugin_ref.stop_audio_if_playing();

      Swal.fire({
          title: trial_info.calibration_lost_dialog_title,
          html:  trial_info.calibration_lost_dialog_text,
          width: 600,
          allowOutsideClick: false,
          showCancelButton: false, 
          confirmButtonText: trial_info.ok_button_label,
      }).then((result) => {
        var trial_data = {
          "start_time": start_time,
          "trial_id": trial_info.id,
          "calibration_lost": true
        };
        jsPsych.finishTrial(trial_data);
      });
  });



  jsPsych.pluginAPI.setTimeout(function(){
    plugin_ref.show_content();
  }, 500);
  };

  return plugin;
})();
