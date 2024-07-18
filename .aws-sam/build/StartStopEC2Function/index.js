const AWS = require("aws-sdk");

// set the region to us-east-1
const getInstanceId = (instance) => {
  return new Promise((resolve, reject) => {
    var ec2 = new AWS.EC2({ region: "eu-west-3" });
    var params = {
      Filters: [
        {
          Name: "tag:Name",
          Values: [`ssec2`],
        },
      ],
    };
    ec2.describeInstances(params, (err, data) => {
      if (err) {
        reject(err.stack);
      } else {
        if (data.Reservations.length === 0) {
          reject(`The instance with name ${instance} not found. <br> Try again with a valid name.`);
        } else {
          var { Reservations } = data;
          var { Instances } = Reservations[0];
          resolve(Instances[0].InstanceId);
        }
      }
    });
  });
};

const startEc2 = (instanceId) => {
  return new Promise((resolve, reject) => {
    var ec2 = new AWS.EC2({ region: "eu-west-3" });
    var params = {
      InstanceIds: [instanceId],
    };
    ec2.startInstances(params, (err, data) => {
      if (err) reject(err.stack);
      else resolve(data);
    });
  });
};

const stopEc2 = (instanceId) => {
  return new Promise((resolve, reject) => {
    var ec2 = new AWS.EC2({ region: "eu-west-3" });
    var params = {
      InstanceIds: [instanceId],
    };
    ec2.stopInstances(params, (err, data) => {
      if (err) reject(err.stack);
      else resolve(data);
    });
  });
};

exports.handler = async (event) => {
  try {
    const action = event.requestContext.stage;
    const { instance } = event.pathParameters;
    var instaceId = await getInstanceId(instance);
    console.log(instaceId);
    let result;
    if (action === 'start') {
      result = await startEc2(instaceId);
    } else if (action === 'stop') {
      result = await stopEc2(instaceId);
    }

    if (typeof result !== "string") {
      let CurrentState, PreviousState;
      if (action === 'start') ({ CurrentState, PreviousState } = result.StartingInstances[0]);
      if (action === 'stop') ({ CurrentState, PreviousState } = result.StoppingInstances[0]);

      const response = {
        statusCode: 200,
        body: `<div style="text-align: center;">
          <p>InstanceId: ${instaceId}</p>
          <p>InstanceName: ${instance}</p>
          <p>CurrentState: ${CurrentState.Name}</p>
          <p>PreviousState: ${PreviousState.Name}</p>
        </div>`,
        headers: {
          'Content-Type': 'text/html',
        },
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: `<div style="text-align: center;">
        <p>${result}</p>
      </div>`,
      headers: {
        'Content-Type': 'text/html',
      },
    };
    return response;
  } catch (e) {
    const response = {
      statusCode: 200,
      body: `<div style="text-align: center;">
        <p>${e}</p>
      </div>`,
      headers: {
        'Content-Type': 'text/html',
      },
    };
    return response;
  }
};
