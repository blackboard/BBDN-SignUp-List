# SignUp List

This project is a migration of a very popular open source building block built by Durham University to a LTI Tool Prover, enabled with the Blackboard Learn REST APIs to handle data. Currently, the work is being documented on the <a href="https://community.blackboard.com/community/developers/projects/signup-list-b2-to-rest-migration" target="_blank">Blackboard Community site</a> for those that want to follow along or participate.

To run this code, 
1. Clone the repository to your computer.
2. Navigate at the commandline to the directory you just created.
3. Run npm install to install all of the dependencies.
4. Run DEBUG=signuplist:* npm start. This will start the server on port 3000.

Once the code is running, simply create a LTI Link in Blackboard Learn. The key and is currently hard-coded to 12345 and secret respectively. The URL is http://localhost:3000/lti. 

As the project progresses, we will update the readme and supporting documentation to show the proper way to inject the key and secret -- as well as REST key and secret -- to make this work in production.
