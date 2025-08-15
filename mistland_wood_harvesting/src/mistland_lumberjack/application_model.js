import { EventDispatcher } from "three";

export class ApplicationModel extends EventDispatcher{

    skeletonAttackDamage = 5;
    logCount = 0;
    gemCount = 0;

    workshopGemsNeeded = getParamsNumberByID("gemsNeeded");

    workshopUnlocked = false;
    axeUpgraded = false;

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

    onSkeletonAttack()
    {
        let tLogsToLose;
        if( this.logCount - this.skeletonAttackDamage >= 0 )
        {
             this.logCount -= this.skeletonAttackDamage;
             tLogsToLose = this.skeletonAttackDamage;
        } else 
        {
            // if remaining logs is less than damage value, just return what that value is
            tLogsToLose = this.logCount;
            this.logCount = 0;
        }
        return tLogsToLose;
    }

    handleLumbermillTick()
    {
        if( this.logCount  > 0 ) {
            this.logCount--;
            this.gemCount++;

            // to trigger a "lose log" animation from the player
            this.dispatchEvent({ type: 'model_event', detail : "lumbermill_tick"});
        }

        const targetGems =  getParamsNumberByID("gemsNeeded");
        const evenTarget = targetGems % 2 == 0 ? targetGems : targetGems-1;
        if( this.gemCount == evenTarget * 0.5 && !this.axeUpgraded )
        {
            this.axeUpgraded = true;
            this.dispatchEvent({ type: 'model_event', detail : "unlock_axe"});
        }
         else if( this.gemCount == targetGems && !this.workshopUnlocked ){
            this.workshopUnlocked = true;
            this.dispatchEvent({ type: 'model_event', detail : "unlock_workshop"});
        }
    }

    handleWorkshopTick()
    {
        if( this.workshopUnlocked )
        {
            if( this.gemCount > 0 )
            {
                this.workshopGemsNeeded--;
                this.gemCount--;
                this.dispatchEvent({ type: 'model_event', detail : "workshop_tick"});

                
            } else this.dispatchEvent({ type: 'model_event', detail : "reveal_workshop"});
        }

        // if( this.workshopGemsNeeded == 0 && !this.workshopUnlocked ){
        //     this.workshopUnlocked = true;
        //     this.dispatchEvent({ type: 'model_event', detail : "unlock_workshop"});
        // }
    }
}