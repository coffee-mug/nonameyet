(function() {
    var state;

    var playerController = {
        init() {
            this.connect();
            this.setupDOM();
            this.setupListener();
            window.onYouTubeIframeAPIReady = () => {
                this.onYouTubeIframeAPIReady.call(this);
            }
        },
        setupDOM() {
            var root = document.createElement('div');
            root.id = "player";
            document.body.appendChild(root);

            // 2. This code loads the IFrame Player API code asynchronously.
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        },
        onYouTubeIframeAPIReady() {

            console.log(this)

            window.player = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: 'M7lc1UVf-VE',
                events: {
                    'onReady': this.onPlayerReady,
                }
            });
        },
        validate(input) {
            var output = "";

            switch(true){
                case /^https:\/\/www\.youtube\.com/.test(input):
                    // normal url, id is in the "v" query param
                    output = input.split("v=")[1]

                    if (!output) {
                        // May be an url extracted from the iframe embed code, let's try
                        // something else
                        output = /embed/.test(input) ? input.split('/').slice(-1)[0] : "";
                    }
                    break
                case /^https:\/\/youtu\.be/.test(input):
                    output = input.split('/').slice(-1)[0];
                    break;
                // Curious enough to try ?
                case input === "banana":
                    output = "h3ilLEN1Qew"
                    break;
                // Want to add a new video to the shortcut list ? 
                // Feel welcome to shoot me your wish on https://twitter.com/lucaskostka
                // I'll do my best to add it quick.
                default:
                    output = "aDm5WZ3QiIE"
            }

            return output;
        },
        onPlayerReady: function onPlayerReady(event) {
            event.target.playVideo();

            this.state = {
                set videoId(newVideoId) {
                    try {
                        window.player.loadVideoById(newVideoId)
                    } catch(e) {
                        console.error(e)
                    }
                }
            }
        },
        setupListener() {
            var updateForm = document.getElementById('form-video');
            var lastTimeSent = Date.now();

            updateForm.addEventListener('submit', function(e) {
                e.preventDefault()

                var newVideo = document.getElementById('input-video')

                var vidId = this.validate(newVideo.value);

                window.state.videoId = vidId;

                // naive request spamming prevention
                if ( (Date.now() - lastTimeSent) > 5 * 1000) {
                    console.log("Allowed to share another video")
                    this.ws.send(vidId);
                }

                lastTimeSent = Date.now();
                //  ah ah, DONE !
            }.bind(this))
        },
        connect() {
            var protocol = document.location.protocol === "https:" ? "wss" : "ws"
            var port = document.location.port

            this.ws = new WebSocket(protocol + "://" + document.location.hostname + (port ? ":" + port : port))

            this.ws.onmessage = (video) => {
                console.log("Received a new video to display", video.data)

                if (video.data !== window.state.videoId) {
                    window.state.videoId = video.data;
                }
            }
        },
    }

    playerController.init();
})();