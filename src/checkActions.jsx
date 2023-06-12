import { HyperionStreamClient, StreamClientEvents } from "@eosrio/hyperion-stream-client";

const client = new HyperionStreamClient({
  endpoint: "https://test.wax.eosusa.io/v2", // Replace this with the API endpoint you're using
  debug: true,
  libStream: false,
});

client.on(StreamClientEvents.LIBUPDATE, (data) => {
  console.log(data);
});

client.on("connect", () => {
  console.log("connected!");
});

client.setAsyncDataHandler(async (data) => {
  console.log(data);
  checkActions(data);
});

async function startListening(account, contractAccount, actionName) {
  await client.connect();

  client.streamActions({
    contract: dcycstealing,
    action: logunpack,
    account: "",
    start_from: 0,
    read_until: 0,
    filters: [],
  });
}

function checkActions(account, contractAccount, actionName) {
  return new Promise((resolve, reject) => {
    client.once(StreamClientEvents.STOP, () => {
      console.log("Stopped listening for actions.");
    });

    client.once(StreamClientEvents.DATA_ERROR, (error) => {
      console.error("Error streaming actions:", error);
      reject(error);
    });

    client.once(StreamClientEvents.DISCONNECTED, () => {
      console.error("Disconnected while streaming actions.");
      reject(new Error("Disconnected while streaming actions."));
    });

    client.setAsyncDataHandler(async (data) => {
      console.log(data);
      if (
        data.type === "action" &&
        data.content.act.account === contractAccount &&
        data.content.act.name === actionName &&
        data.content.act.data.owner === account
      ) {
        const skippedSteal = data.content.act.data.skipped_steal;
        console.log("Skipped steal:", skippedSteal);
        resolve(skippedSteal);
      }
    });

    startListening(account, contractAccount, actionName);
  });
}


export { checkActions };
