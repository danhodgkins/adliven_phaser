import { logoPNG } from '../../media/logo.png.js';

export class UIController{

    timeoutID=-1;
    constructor( uiLayerElement ){
        this.uiLayerElement = uiLayerElement;
        uiLayerElement.innerHTML = inGameUIString();
        this.boundTempOutputTimeout = this.onTempOutputTimeout.bind(this);
    }

    displayTime( remaining )
    {
        // const el = document.getElementById("timerOutput");
        // el.innerHTML = remaining ;
    }

    showIntro()
    {
        const el = document.getElementById("gameOutput");
        el.innerHTML = `Get Ready!`;

        if( this.timeoutID > -1  ) clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( this.boundTempOutputTimeout, 2000 );
    }

    onScoreUpdate( score )
    {       
        const el = document.getElementById("scoreOutput");
        el.innerHTML = `Score: ${score}`;
    }

    onLevelUpdate( currentLevel )
    {
        const el = document.getElementById("levelOutput");
        el.innerHTML = `Level: ${currentLevel}`;
    }

    onGameOver( )
    {
        const el = document.getElementById("gameOutput");
        el.innerHTML = `Game complete!`;

        if( this.timeoutID > -1  ) clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( this.boundTempOutputTimeout, 2000 );
    }

    onLevelUp( currentLevel)
    {
        this.onLevelUpdate( currentLevel );
        const el = document.getElementById("gameOutput");
        el.innerHTML = `Level ${currentLevel} complete!`;

        if( this.timeoutID > -1  ) clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( this.boundTempOutputTimeout, 2000 );
    }

    onLevelFailed( currentLevel ){
        const el = document.getElementById("gameOutput");
        el.innerHTML = `Level ${currentLevel} FAILED!`;

        if( this.timeoutID > -1  ) clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( this.boundTempOutputTimeout, 2000 );
    }

    onTempOutputTimeout(){
        const el = document.getElementById("gameOutput");
        el.innerHTML = "";
        this.timeoutID = -1;
    }
}

function splashUIString()
{
    return `
        <div id="headerRow">
            <div id="logoCont" class="headerRowItem">
                <img src = ${ logoPNG } />
            </div>
            <div class="spacer"></div>
        
        </div>
        <div class="spacer"></div>
    `;
}

function inGameUIString()
{
    return `
        <div id="headerRow">
            <div id="logoCont" class="headerRowItem">
                <img src = ${ logoPNG } />
            </div> 
            <div class="spacer"></div>
            <button id="ctaButton">PLAY NOW</button>
        </div>

        <div class="spacer"></div>

        <div><h1 id="gameOutput"></h1></div>

        <div id="inGameUIContainer" >
            <div id="scoreOutput"></div>
            <div class="spacer"></div>
            <div id="timerOutput"></div>            
            <div class="spacer"></div>
            <div id="levelOutput"></div>            
        </div>
    `;
}