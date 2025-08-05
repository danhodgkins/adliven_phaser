import { EventDispatcher } from "three";

export class ApplicationModel extends EventDispatcher{

    logCount = 0;
    gemCount = 0;

    constructor() {
        super();   
    }

    onLogCollected(){
        if( this.logCount < getParamsNumberByID("backpackSize") )
        {
            this.logCount++;
            this.dispatchEvent({ type: 'model_event', detail : "log_collected" });
        }
    }

    handleLumbermillTick()
    {
        if( this.logCount  > 0 ) {
            this.logCount--;
            this.gemCount++;
        }

        const targetGems =  getParamsNumberByID("gemsNeeded");
        const evenTarget = targetGems % 2 == 0 ? targetGems : targetGems-1;
        if( this.gemCount == targetGems * 0.5 )
        {
            this.dispatchEvent({ type: 'model_event', detail : "unlock_axe"});
        } else if( this.gemCount == targetGems ){
            this.dispatchEvent({ type: 'model_event', detail : "unlock_workshop"});
        }
    }
}