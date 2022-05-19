using Alchemy;
using Alchemy.Classes;
using Microsoft.Kinect;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace SocketServer
{
    public class Coordinates
    {
        public Coordinates(float x, float y, float z)
        {
            this.X = x;
            this.Y = y;
            this.Z = z;
        }

        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
    }

    public class Program
    {
        private static KinectSensor sensor;

        private static WebSocketServer server;
        private static UserContext connection = null;

        static void Main(string[] args)
        {
            server = new WebSocketServer(9001, IPAddress.Any)
            {
                OnConnected = OnConnected,
                TimeOut = new TimeSpan(0, 5, 0)
            };

            server.Start();
            InitializeDevice();

            var command = string.Empty;
            while (command != "exit")
            {
                command = Console.ReadLine();
            }

            server.Stop();
        }

        /// <summary>
        /// Event handler for Kinect sensor's SkeletonFrameReady event
        /// </summary>
        /// <param name="sender">object sending the event</param>
        /// <param name="e">event arguments</param>
        private static void SensorSkeletonFrameReady(object sender, SkeletonFrameReadyEventArgs e)
        {
            Skeleton[] skeletons = new Skeleton[0];

            using (SkeletonFrame skeletonFrame = e.OpenSkeletonFrame())
            {
                if (skeletonFrame != null)
                {
                    skeletons = new Skeleton[skeletonFrame.SkeletonArrayLength];
                    skeletonFrame.CopySkeletonDataTo(skeletons);
                }
            }

            if (skeletons.Length != 0)
            {
                foreach (Skeleton skel in skeletons)
                {
                    if (skel.TrackingState == SkeletonTrackingState.Tracked && skel.Joints[JointType.Head].TrackingState == JointTrackingState.Tracked)
                    {
                        var joint = skel.Joints[JointType.Head];
                        Coordinates coords = new Coordinates(joint.Position.X, joint.Position.Y, joint.Position.Z);
                        SendNewCoordinates(coords);
                    }
                }
            }
        }

        private static void SendNewCoordinates(Coordinates coords)
        {
            if (connection != null) {
                connection.Send(coords.X + "|" + coords.Y + "|" + coords.Z);
            }
        }

        private static void InitializeDevice()
        {
            foreach (var potentialSensor in KinectSensor.KinectSensors)
            {
                if (potentialSensor.Status == KinectStatus.Connected)
                {
                    sensor = potentialSensor;
                    break;
                }
            }

            if (sensor == null) {
                throw new IOException("No sensor");
            }

            sensor.SkeletonStream.Enable();

            // Add an event handler to be called whenever there is new color frame data
            sensor.SkeletonFrameReady += SensorSkeletonFrameReady;

            // Start the sensor!
            sensor.Start();
        }
        
        private static void OnConnected(UserContext context)
        {
            connection = context;
        }
    }
}
