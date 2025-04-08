const {adams }= require ('../Ibrahim/adams') ;
const {addstickcmd, deleteCmd, getCmdById, inStickCmd , getAllStickCmds} = require('../lib/stickcmd') ;
const { handleOneRenderCommand } = require('./onerender');
const { handleContactCommand } = require('./contact');
const { handleViewOnceCommand } = require('./viewonce');



adams(
    {
        nomCom : 'setcmd',
        categorie : 'stickcmd'
        
    }, async (dest,zk,commandeOptions) => { 

   const {ms , arg, repondre,superUser , msgRepondu} = commandeOptions;

    if (!superUser) { repondre('you can\'t use this command') ; return} ;

      if(msgRepondu && msgRepondu.stickerMessage )  {
  
         if(!arg || !arg[0]) { repondre('put the name of the command') ; return} ;
          
        
         await addstickcmd(arg[0].toLowerCase() , msgRepondu.stickerMessage.url ) ;

         repondre('Stick cmd save successfully')

      } else {

        repondre('mention a sticker')
      }

    }) ; 

    adams(
      {
          nomCom: 'delcmd',
          categorie: 'stickcmd'
      },
      async (dest, zk, commandeOptions) => {
  
          const { ms, arg, repondre, superUser } = commandeOptions;
  
          if (!superUser) {
              repondre('only Mods can use this command');
              return;
          }
  
          if (!arg || !arg[0]) {
              repondre('put the name of the command that you want to delete');
              return;
          }
  
          const cmdToDelete = arg[0];

  
          try {
              await deleteCmd(cmdToDelete.toLowerCase());
              repondre(`the commande ${cmdToDelete} is deleted successfully.`);
          } catch {
              repondre(`the command ${cmdToDelete} don't existe`);
          }
      }
  );
  

  adams(
    {
        nomCom: 'allcmd',
        categorie: 'stickcmd'
    },
    async (dest, zk, commandeOptions) => {
        const { repondre, superUser } = commandeOptions;

        if (!superUser) {
            repondre('only Mods can use this command');
            return;
        }

        const allCmds = await getAllStickCmds();

        if (allCmds.length > 0) {
            const cmdList = allCmds.map(cmd => cmd.cmd).join(', ');
            repondre(`*List of all stickcmd :*
 ${cmdList}`);
        } else {
            repondre('No stickcmd save');
        }
    }
);

// Add to command list
const commands = {
    // ... existing commands ...
    onerender: handleOneRenderCommand,
    contact: handleContactCommand,
    viewonce: handleViewOnceCommand,
    vv: handleViewOnceCommand, // Alias for viewonce
    // ... existing commands ...
};
