# Sign Up List
MEAN (Mongodb, Express, Angular, Node) port the original Sign Up List written by Malcolm Murray and Stephen Vickers <a href="http://projects.oscelot.org/gf/project/signup/">on projects.oscelot.com</a>.

You may visit our demo site - coming soon - , download the source and run locally, or use the below button to deploy to your heroku account.

<a href="https://heroku.com/deploy">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Whether you download or deploy to run the demo you will need to visit developer.blackboard.com and create a developer account and application. You will use your key and secret provided when you set the heroku deploy configuration.

## To Run Locally
1. Download the source
2. Using a terminal, cd into the project directory at the server.js level
3. To setup: type in the terminal: npm install
4. To start the app type in the terminal: DEBUG=signuplist:\* npm start & echo $! > .pid
5. To stop the app type in the terminal: DEBUG=signuplist:\* npm stop

To view in Blackboard add the LTI application and LTI placement via the System Admin Panel using your deployed settings...

As the project progresses, we will update this readme and supporting documentation to show complete setup as well as REST key and secret usage.