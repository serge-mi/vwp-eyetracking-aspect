/**
 * jspsych-browser-check
 * a jspsych plugin for the Blink experiment
 *
 * Onur Ferhat
 *
 */

jsPsych.plugins['browser-check'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'browser-check',
    description: '',
    parameters: {
      test_audio: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Audio',
        default: null,
        description: 'Path to the audio to play to test audio autoplay'
      },
      no_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: '"No" button label',
        default: 'No',
        description: 'The text that appears on the "No" button.'
      },
      yes_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: '"Yes" button label',
        default: 'Yes',
        description: 'The text that appears on the "Yes" button.'
      },
      ok_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: '"OK" button label',
        default: 'OK',
        description: 'The text that appears on the "OK" button.'
      },
      sound_check_dialog_title: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Sound check dialog title',
        default: 'Sound Check',
        description: 'The title of the "Sound Checl" dialog.'
      },
      sound_check_dialog_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Sound check dialog text',
        default: "Can you hear the sound that's being played? You may need to unmute the current tab in your browser, and turn on the volume on your computer.",
        description: 'The text of the "Sound Check" dialog.'
      },
      webcam_check_dialog_title: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Webcam check dialog title',
        default: 'Webcam Check',
        description: 'The title of the "Webcam Check" dialog.'
      },
      webcam_check_dialog_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Webcam check dialog text',
        default: 'We are trying to detect your webcam. You may need to give permission from web browser when prompted.',
        description: 'The text of the "Webcam Check" dialog.'
      },
      browser_incompatible_dialog_title: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Browser incompatible dialog title',
        default: 'Incompatible Browser',
        description: 'The title of the "Browser Incompatible" dialog.'
      },
      browser_incompatible_dialog_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Browser incompatible dialog text',
        default: 'We are sorry, but your browser is incompatible with this experiment. You may retry from another supported browser (Chrome, Firefox, Edge) on a laptop or desktop computer.',
        description: 'The text of the "Browser Incompatible" dialog.'
      },
      no_webcam_dialog_title: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'No webcam dialog title',
        default: 'No Webcam',
        description: 'The title of the "No Webcam" dialog.'
      },
      no_webcam_dialog_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'No webcam dialog text',
        default: 'We are sorry, but we could not detect your webcam. You may retry after checking your webcam setup, and making sure to give permission from web browser when prompted.',
        description: 'The text of the "No Webcam" dialog.'
      },
    }
  }

  plugin.trial = function(display_element, trial) {
    var is_chrome = navigator.userAgent.indexOf("Chrome") > -1;
    var is_firefox = navigator.userAgent.indexOf("Firefox") > -1; 
    var is_opera = navigator.userAgent.indexOf("OP") > -1; 
    var is_edge = navigator.userAgent.indexOf("Edg/") > -1;
    var is_supported = is_chrome || is_firefox || is_opera || is_edge;

    var dialog = function(options) {
        if (options === undefined) options = {};
        if (options.title === undefined) options.title = "";
        if (options.text === undefined) options.text = null;
        if (options.confirm === undefined) options.confirm = "OK";
        if (options.cancel === undefined) options.cancel = false;

        return Swal.fire({
            title: options.title,
            text: options.text,
            width: 600,
            allowOutsideClick: false,
            showCancelButton: (options.cancel == false) ? false : true, 
            cancelButtonText: options.cancel,
            confirmButtonText: options.confirm,
        })
    }

    var compatible_browser = function() {
      // move on to the next trial
      jsPsych.finishTrial({});
    }

    var incompatible_browser = function() {
      dialog({
          title: trial.browser_incompatible_dialog_title,
          text: trial.browser_incompatible_dialog_text,
          confirm: trial.ok_button_label
      }).then((result) => {
          jsPsych.endExperiment(trial.browser_incompatible_dialog_title);
      });
    }

    var no_webcam = function() {
      dialog({
          title: trial.no_webcam_dialog_title,
          text: trial.no_webcam_dialog_text,
          confirm: trial.ok_button_label
      }).then((result) => {
          jsPsych.endExperiment(trial.no_webcam_dialog_title);
      });
    }

    var is_mobile = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) is_mobile = true;})(navigator.userAgent||navigator.vendor||window.opera);

    if(is_mobile || ! is_supported) {
      incompatible_browser();
      return;
    }

    navigator.getMedia = (navigator.getUserMedia || // use the proper vendor prefix
                     navigator.webkitGetUserMedia ||
                     navigator.mozGetUserMedia ||
                     navigator.msGetUserMedia);

    navigator.getMedia({video: true}, function() {
        var html = '';
        html += '<style>'+
        'audio {display:none;}' +
        '</style>'+
        '<audio autoplay loop>'+
        '  <source src="'+trial.test_audio+'.ogg" type="audio/ogg">'+
        '  <source src="'+trial.test_audio+'.mp3" type="audio/mpeg">'+
        '</audio>'
        display_element.innerHTML = html;

        dialog({
            title: trial.sound_check_dialog_title,
            text: trial.sound_check_dialog_text,
            cancel: trial.no_button_label,
            confirm: trial.yes_button_label
        }).then((result) => {
            // Stop the test sound
            document.getElementsByTagName("audio")[0].pause()
            if (result.isConfirmed) {
              compatible_browser();
            } else {
              incompatible_browser();
            }
        });
    }, function() {
      no_webcam();
    });

    dialog({
        title: trial.webcam_check_dialog_title,
        text: trial.webcam_check_dialog_text,
        confirm: trial.ok_button_label
    }).then((result) => {
      // Do nothing
      ;
    });
  };


  return plugin;
})();
