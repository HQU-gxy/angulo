from flask import Flask, render_template, Response
import cv2
import time
import threading

app = Flask(__name__, static_url_path='', static_folder='static')

main_cam_url = "rtsp://192.168.137.161:8554/unicast"
alt_cam_url = "rtsp://192.168.137.49:8554/unicast"

class MainCamera(object):
    def __init__(self, url): 
        self.url = url
        # self.cap = cv2.VideoCapture(url)
    def gen_frames(self):
        """Generate frame by OpenCV from video soure by camera id"""
        bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

        cap = cv2.VideoCapture(self.url)
        success, frame = cap.read()  # read the camera frame
        while True:
            # for cap in caps:
            # # Capture frame-by-frame
            if not success:
                break
            else:
                # ret, buffer = cv2.imencode('.jpg', frame)

                fg_mask = bg_subtractor.apply(frame)
                _, thresh = cv2.threshold(fg_mask, 244, 255, cv2.THRESH_BINARY)
                cv2.erode(thresh, erode_kernel, thresh, iterations=2)
                cv2.dilate(thresh, dilate_kernel, thresh, iterations=2)
                contours, hier = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                                cv2.CHAIN_APPROX_SIMPLE)
                for c in contours:
                    if cv2.contourArea(c) > 1000:
                        x, y, w, h = cv2.boundingRect(c)
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 0), 2)

                ret, buffer = cv2.imencode('.jpg', frame)
                framebytes = buffer.tobytes()
                yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + framebytes + b'\r\n')
                success, frame = cap.read()
                # concat frame one by one and show result

class AltCamera(object):
    def __init__(self, url): 
        self.url = url
        # self.cap = cv2.VideoCapture(url)
    def gen_frames(self):
        """Generate frame by OpenCV from video soure by camera id"""
        cap = cv2.VideoCapture(self.url)
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
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                # concat frame one by one and show result

main_cam = MainCamera(main_cam_url)
alt_cam = AltCamera(alt_cam_url)

@app.route('/video_feed/<string:id>/', methods=["GET"])
def video_feed(id):
    """Video streaming route. Put this in the src attribute of an img tag."""
    if int(id) == 0:
        return Response(main_cam.gen_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')
    else:
        return Response(alt_cam.gen_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/', methods=["GET"])
def index():
    """Render"""
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
