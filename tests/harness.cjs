const fs = require('fs');
const path = require('path');
const vm = require('vm');
function createHarness({pinDelay=0,clampBanks=false}={}) {
    const callbacks={}, writes=[], midi=[], sysex=[], presetMessages=[], tasks=[], selections=[];
    let project=[], uiTrack=null, uiDevice=null, tick=0, pending=false;
    const sources=[], proxies=[];
    function observable(initial) {
        let current=initial; const listeners=[];
        return {addValueObserver(fn){listeners.push(fn);fn(current);},get:()=>current,
            set(v){if(current===v)return;current=v;listeners.forEach(fn=>fn(v));}};
    }
    function dynamic(getter) {
        const v=observable(getter()); sources.push(()=>v.set(getter())); return v;
    }
    function schedule(fn,ms=0){tasks.push({fn,ms,at:tick+ms});}
    function refresh() {
        pending=false;
        // Equality and metadata notifications arrive asynchronously, as in Bitwig.
        for(const update of sources)update();
        for(const p of proxies)p.refresh();
    }
    function changed(){if(!pending){pending=true;schedule(refresh);}}
    const remoteState=Array.from({length:8},(_,i)=>{
        const state={name:observable(''),exists:observable(false),value:observable(0.5),display:observable('')};
        state.value.inc=amount=>{writes.push(['remote',i,amount]);state.value.set(Math.max(0,Math.min(1,state.value.get()+amount)));};
        state.value.displayedValue=()=>state.display;return state;
    });
    const remotePage={name:observable('Remote Controls'),index:observable(0),count:observable(0),
        getName(){return this.name;},selectedPageIndex(){return this.index;},pageCount(){return this.count;},
        getParameter:i=>({name:()=>remoteState[i].name,exists:()=>remoteState[i].exists,value:()=>remoteState[i].value}),
        selectNextPage(){this.index.set(this.index.get()+1);},selectPreviousPage(){this.index.set(this.index.get()-1);}};
    function parent(d){return project.find(t=>t.devices.includes(d))||d?.parent||null;}
    function deviceProxy(resolve,isMain=false) {
        let previous=null, idKey='', idsListener, valueListener;
        const p={resolve,exists:()=>dynamic(()=>!!resolve()),name:()=>({addValueObserver(fn){if(isMain)callbacks.name=fn;dynamic(()=>resolve()?.name||'').addValueObserver(fn);}}),
            position:()=>dynamic(()=>parent(resolve())?.devices.indexOf(resolve())??-1),
            getDeviceChain:()=>trackProxy(()=>parent(resolve())),
            createEqualsValue:other=>dynamic(()=>!!resolve()&&resolve()===other.resolve()),
            addDirectParameterIdObserver(fn){idsListener=fn;if(isMain)callbacks.ids=fn;fn(resolve()?.ids||[]);},
            addDirectParameterNormalizedValueObserver(fn){valueListener=fn;if(isMain)callbacks.value=fn;},
            addDirectParameterValueDisplayObserver(n,fn){if(isMain)callbacks.display=fn;return{setObservedParameterIds:ids=>callbacks.observed=ids};},
            createCursorRemoteControlsPage:()=>remotePage,
            setDirectParameterValueNormalized(...args){writes.push(['set',...args]);if(resolve())resolve().values[args[0]]=args[1]/(args[2]-1);},
            selectInEditor(){uiDevice=resolve();uiTrack=parent(uiDevice);selections.push(uiDevice);follow();changed();},
            refresh(){const d=resolve(),key=JSON.stringify(d?.ids||[]);if(key!==idKey){idKey=key;if(idsListener)idsListener(d?.ids||[]);}if(d!==previous){previous=d;if(valueListener&&d)for(const id of d.ids)valueListener(id,d.values[id]??0.5);}}
        };proxies.push(p);return p;
    }
    const cursors=[];
    function trackProxy(resolve) {
        return {resolve,exists:()=>dynamic(()=>!!resolve()),name:()=>dynamic(()=>resolve()?.name||''),position:()=>dynamic(()=>project.indexOf(resolve())),
            createEqualsValue:other=>dynamic(()=>!!resolve()&&resolve()===other.resolve()),
            selectInEditor(){uiTrack=resolve();uiDevice=uiTrack?.devices[0]||null;follow();changed();},
            createDeviceBank(width){let offset=0;const pos=observable(0);const set=pos.set;pos.set=v=>{offset=clampBanks?Math.min(v,Math.max(0,(resolve()?.devices.length||0)-width)):v;set(offset);changed();};return{scrollPosition:()=>pos,itemCount:()=>dynamic(()=>resolve()?.devices.length||0),getItemAt:i=>deviceProxy(()=>resolve()?.devices[offset+i]||null)};}};
    }
    function follow(){for(const c of cursors){if(c.follow)c.track=uiTrack;if(c.follow&&!c.pin.get())c.dev=uiDevice;}}
    let main;
    function createCursorTrack(id,name,sends,scenes,followSelection) {
        const c={track:uiTrack,dev:uiDevice,follow:followSelection,pin:observable(false)};cursors.push(c);
        const t=trackProxy(()=>c.track);
        t.selectChannel=other=>{c.track=other.resolve();changed();};
        t.createCursorDevice=()=>{
            const d=deviceProxy(()=>c.dev,id==='lcxl3-iroko-track');
            d.selectDevice=other=>{c.dev=other.resolve();c.track=parent(c.dev);changed();};
            d.isPinned=()=>c.pin;
            const set=c.pin.set;c.pin.set=v=>{
                const apply=()=>{set(v);if(!v&&c.follow){c.dev=uiDevice;changed();}};
                if(pinDelay&&id==='lcxl3-iroko-track')schedule(apply,pinDelay);else apply();
            };
            if(id==='lcxl3-iroko-track')main={c,t,d};return d;
        };return t;
    }
    const context={loadAPI:()=>{},CursorDeviceFollowMode:{FOLLOW_SELECTION:0},host:{
        scheduleTask:schedule,sendDatagramPacket:()=>{},defineController:()=>{},defineMidiPorts:()=>{},addDeviceNameBasedDiscoveryPair:()=>{},
        getMidiOutPort:()=>({sendMidi:(...args)=>midi.push(args),sendSysex:s=>sysex.push(s)}),
        getMidiInPort:()=>({setMidiCallback:fn=>callbacks.midi=fn,createNoteInput:()=>({setShouldConsumeEvents:()=>{},sendRawMidiEvent:(...args)=>presetMessages.push(args)})}),
        createCursorTrack,createTrackBank(n,sends,scenes,flat){if(n!==1||!flat)throw Error('Expected flat paged track bank');let offset=0;const pos=observable(0),set=pos.set;pos.set=v=>{offset=v;set(v);changed();};return{scrollPosition:()=>pos,itemCount:()=>dynamic(()=>project.length),getItemAt:()=>trackProxy(()=>project[offset]||null)};}
    }};
    vm.createContext(context);
    context.load=file=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
    context.load('LCXL3 Device Profiles.control.js');context.init();
    function drain(until=()=>false) {
        let budget=50000;
        while(tasks.length&&!until()) {if(--budget===0)throw Error('Task queue failed to settle');tasks.sort((a,b)=>a.at-b.at);const task=tasks.shift();tick=task.at;task.fn();context.flush();}
    }
    function select(t,d=0){uiTrack=project[t]||null;uiDevice=uiTrack?.devices[d]||null;follow();changed();}
    function setProject(tracks,t=0,d=0){project=tracks;select(t,d);drain();}
    function plugin(name,ids,values={}){return{name,ids:Array.from(ids),values:{...values}};}
    function selectDevice(name,parameters={},values={}) {
        if(main.c.pin.get())return;
        const obj=plugin(name,Object.values(parameters),values);project=[{name:'Test Track',devices:name?[obj]:[]}];select(0);drain();context.flush();
        // Existing regression fixtures can inject captured host callbacks directly.
    }
    return {context,callbacks,writes,midi,sysex,presetMessages,remoteState,remotePage,pinned:main.c.pin,tasks,selections,
        present:{set:v=>callbacksExists(v)},selectDevice,select,setProject,plugin,drain,changed,get target(){return main.c.dev;},get project(){return project;}};
    function callbacksExists(v){if(!v)selectDevice('',{});}
}
module.exports={createHarness};
