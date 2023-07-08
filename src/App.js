import './App.css';
import { useEffect, useState } from 'react';

const useMusic = url => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [initialized, setInitialized] = useState(false);

  // const audio1 = new Audio();
  // audio1.crossOrigin = "anonymous";
  // audio1.src = url;
  const [audioCtx, setAudioCtx] = useState();
  const [audioSource, setAudioSource] = useState();
  const [analyser, setAnalyser] = useState();

  const togglePlaying = () => {
    if(!initialized){
      const audio = document.getElementById('audio');
      let aCtx = new (window.AudioContext || window.webkitAudioContext)()

      audio.play();
      setAudioCtx(aCtx);
      let aSource = aCtx.createMediaElementSource(audio);
      let anal = aCtx.createAnalyser();
      aSource.connect(anal);
      anal.connect(aCtx.destination);
      anal.fftSize = 512;
      anal.smoothingTimeConstant = 0.7;

      setAudioSource(aSource);
      setAnalyser(anal);
      
      setInitialized(true);
      setPlaying(true);
    } else {
      setPlaying(!playing);
    }
  }

  useEffect(() => {
    const audio = document.getElementById('audio');
    playing ? audio.play() : audio.pause();

    console.log(playing);
  }, [playing]);

  useEffect(() => {
    const audio = document.getElementById('audio');
    audio.volume = volume;
  }, [volume])

  return [playing, togglePlaying, setVolume, audioSource, analyser, initialized];
}

const VisualiserBar = (props) => {
  const [bufferLength, setBufferLength] = useState(props.analyser.frequencyBinCount);
  const [dataArray, setDataArray] = useState(new Uint8Array(props.analyser.frequencyBinCount));
  const [visArray, setVisArray] = useState([])
  let angles = []
  const steps = 128;
  const [angleArray, setAngleArray] = useState(() => {

    for(let i=0; i<steps;i++){
      let xangle = Math.cos((Math.PI * 2 * (i/(steps-1))) - Math.PI/2)
      let yangle = Math.sin((Math.PI * 2 * (i/(steps-1))) - Math.PI/2)
      angles.push([xangle, yangle])
    }
    return angles
  })

  useEffect(() => {
    const interval = setInterval(() => {
      let dArr = new Uint8Array(bufferLength);
      props.analyser.getByteFrequencyData(dArr);
      setDataArray(dArr);
      let avgarr = new Uint8Array(dArr);
      let graph = [];
      let inRad = 3;
      let outRad = 12;
      let smoothingSteps = 1;
      let smoothingRadius = 3;

      for(let j=0;j<smoothingSteps;j++){
        let temp = new Uint8Array(avgarr)
        for(let i=0;i<steps;i++){
          let local = []
          for(let k=i-smoothingRadius; k<=i+smoothingRadius; k++){
            local.push(k>0 ? (k < 127 ? temp[k] : temp[k-127]) : temp[127+k])
          }
          temp[i] = local.reduce((sum, v) => sum + v, 0) / (1 + smoothingRadius * 2);
        }
        avgarr = temp;
      }
      
      for(let i=0;i<steps;i++){
        let xangle = angleArray[i][0];
        let yangle = angleArray[i][1];
        let localAvg = avgarr[i];
        graph.push(<line key={"viz"+i} x1={inRad*xangle} y1={inRad*yangle} x2={(inRad + (localAvg/256)*(outRad-inRad))*xangle} y2={(inRad + (localAvg/256)*(outRad-inRad))*yangle}/>)
      }
      setVisArray(graph);
    }, 30)
  }, [])

  return (
    <g className='visualizer'>
      {visArray}
    </g>
  )
}

const App = () => {

  const [getAngle, setAngle] = useState(Math.PI*0.5);
  const [getClicked, setClicked] = useState(null);
  const [audio, togglePlay, setVolume, audioSource, analyser, initialized] = useMusic("https://kzscfms1-geckohost.radioca.st/kzschigh");
  // const [audioctx] = useState(new AudioContext());
  // const [audiosource] = useState(audioCtx.createMediaElementSource())

  const volSlider = []
  const [varray, setVarray] = useState(() => {
    // lol why am i doing this this way? not sure but it works :) plus i can always edit it later
    let inRad = 3.5;
    let outRad = 4.6;
    let steps = 12;
    for(let i=0;i<steps;i++){
      let xangle = Math.cos(-Math.PI/4 + (Math.PI/2 * (i/(steps-1))))
      let yangle = Math.sin(-Math.PI/4 + (Math.PI/2 * (i/(steps-1))))
      volSlider.push(<line key={"vol"+i} x1={inRad*xangle} y1={inRad*yangle} x2={(outRad-(i/(steps-1)))*xangle} y2={(outRad-(i/(steps-1)))*yangle}/>)
    }
    return volSlider;
  })

  const rotateKnob = (e) => {
    if(!getClicked){
      return
    }

    let relativeMousePos = [e.nativeEvent.offsetX - 256, e.nativeEvent.offsetY - 256];
    let angle = Math.atan2(...relativeMousePos);
    let percent = (angle-(Math.PI * 0.26))/(Math.PI * 0.5)
    if(percent < 0){
      percent = 0;
    }
    
    if(Math.PI * 0.25 < angle && angle < Math.PI * 0.75){
      setAngle(Math.atan2(...relativeMousePos));
      setVolume(percent);
    }
  }
  
  useEffect(() => {
    // const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  }, [])

  return (
    <div className="App">
      <audio id='audio' hidden src='https://kzscfms1-geckohost.radioca.st/kzschigh' preload='auto' crossOrigin='anonymous'/>
      <svg viewBox='-12 -12 24 24' className='dial' onMouseDown={() => setClicked(true)} onMouseUp={() => setClicked(null)} onMouseLeave={() => setClicked(null)} onMouseMove={rotateKnob}>
        <defs>
          
        </defs>
        {/* <g className='background'>
          <circle cx='0' cy='0' r='12'/>
        </g> */}
        {initialized && <VisualiserBar analyser={analyser}/>}
        <g className='knob' >
          <circle cx='0' cy='0' r='3'/>
          <g className='dot'>
            <circle cx ={Math.sin(getAngle) * 2.5} cy={Math.cos(getAngle) * 2.5} r='0.15'/>
          </g>
        </g>
        <g className='play' onClick={() => togglePlay()}>
          <circle cx='0' cy='0' r='1.5'/>
          
        </g>
        <g className='volume'>
          {varray}
        </g>
      </svg>
    </div>
  );
}

export default App;
