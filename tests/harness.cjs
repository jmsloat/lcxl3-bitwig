const fs = require('fs');
const path = require('path');
const vm = require('vm');
function createHarness() {
    const callbacks = {}, writes = [], midi = [], sysex = [], presetMessages = [], tasks = [];
    function observable(initial) {
        let current=initial;
        const listeners=[];
        return {addValueObserver(fn) {listeners.push(fn); fn(current);},get:()=>current,
            set(v) { current=v; listeners.forEach(fn=>fn(v)); }};
    }
    const remoteState=Array.from({length:8},(_,i)=>{
        const state={name:observable(''),exists:observable(false),value:observable(0.5),display:observable('')};
        state.value.inc=amount=>{writes.push(['remote',i,amount]);state.value.set(Math.max(0,Math.min(1,state.value.get()+amount)));};
        state.value.displayedValue=()=>state.display;
        return state;
    });
    const remotePage={name:observable('Remote Controls'),index:observable(0),count:observable(0),
        getName(){return this.name;},selectedPageIndex(){return this.index;},pageCount(){return this.count;},
        getParameter:i=>({name:()=>remoteState[i].name,exists:()=>remoteState[i].exists,value:()=>remoteState[i].value}),
        selectNextPage(){this.index.set(this.index.get()+1);},selectPreviousPage(){this.index.set(this.index.get()-1);}
    };
    const present=observable(true), pinned=observable(false);
    const device={
        exists:()=>present,isPinned:()=>pinned,createCursorRemoteControlsPage:()=>remotePage,
        name:()=>({addValueObserver:fn=>callbacks.name=fn}),
        addDirectParameterIdObserver:fn=>callbacks.ids=fn,
        addDirectParameterNormalizedValueObserver:fn=>callbacks.value=fn,
        addDirectParameterValueDisplayObserver:(n,fn)=>{callbacks.display=fn;return {setObservedParameterIds:ids=>callbacks.observed=ids};},
        setDirectParameterValueNormalized:(...args)=>writes.push(['set',...args])
    };
    const context={loadAPI:()=>{},CursorDeviceFollowMode:{FOLLOW_SELECTION:0},host:{
        scheduleTask:(fn,ms)=>tasks.push({fn,ms}),sendDatagramPacket:()=>{},
        defineController:()=>{},defineMidiPorts:()=>{},addDeviceNameBasedDiscoveryPair:()=>{},
        getMidiOutPort:()=>({sendMidi:(...args)=>midi.push(args),sendSysex:s=>sysex.push(s)}),
        getMidiInPort:()=>({setMidiCallback:fn=>callbacks.midi=fn,createNoteInput:()=>({setShouldConsumeEvents:()=>{},sendRawMidiEvent:(...args)=>presetMessages.push(args)})}),
        createCursorTrack:()=>({createCursorDevice:()=>device})
    }};
    vm.createContext(context);
    context.load=file=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
    context.load('LCXL3 Device Profiles.control.js');context.init();
    function selectDevice(name, parameters={}, values={}) {
        if(pinned.get())return;
        present.set(!!name);callbacks.name(name);callbacks.ids(Object.values(parameters));
        for(const id of Object.values(parameters))callbacks.value(id,values[id]===undefined?0.5:values[id]);
        context.flush();
    }
    return {context,callbacks,writes,midi,sysex,presetMessages,remoteState,remotePage,present,pinned,tasks,selectDevice};
}
module.exports={createHarness};
