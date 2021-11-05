from flask import Flask, render_template, Response
import cv2

app = Flask(__name__, static_url_path='', static_folder='static')

# This is the test msg for sync
def find_camera(id):
    """
    for cctv camera use rtsp://username:password@ip_address:554/user=username_password='password'_channel=channel_number_stream=0.sdp' instead of camera
    for webcam use zero(0)
    """
    cameras = ["rtsp://127.0.0.1:8554/unicast", "rtsp://192.168.137.49:8554/unicast"]
    return cameras[int(id)]

def gen_frames(camera_id):
    """Generate frame by OpenCV from video soure by camera id"""
    cam = find_camera(camera_id)
    cap=  cv2.VideoCapture(cam)
    while True:
        # for cap in caps:
        # # Capture frame-by-frame
        success, frame = cap.read()  # read the camera frame
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')  # concat frame one by one and show result


@app.route('/video_feed/<string:id>/', methods=["GET"])
def video_feed(id):
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen_frames(id),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/', methods=["GET"])
def index():
    """Render"""
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
