# Release Methodology

## Deploy Pipeline Overview
For this repository, the deploy pipeline follows these steps:
- Merge a working branch to `develop` branch => triggers a deploy to stage environment
- Merge `develop` branch into `master` branch => triggers a deploy to production environment

## Lead Developer: Tag and release `Production` branch
After the final step of the deployment pipeline, the lead developer must tag and release the production branch so that the 
Project Manager/s can complete their Release Notes.

Once the `master` branch is merged into the `production` branch, then:
1. goto the [release section](https://github.com/CityOfBoston/patterns/releases) of the repository,
2. note the last release number, 
3. click the "Draft a New Release" button
4. click on "Choose a Tag" and create a new tag, follow the pattern vYYYY.n where in is a number which increments (e.g. v2023.1).
5. ensure the Target is the `production` branch
6. give the release a title. This should be the same as the tag name in step 4 above.
7. in the Description, copy and paste in the template below, then click the `Generate release notes` button to append the commits to be bottom of the textbox. Update the "Jira Tickets` section with all tickets that have been addressed in this release. Update the " Linked Drupal Release" section with the release of boston.gov linked with this release of Patterns (if this release of patterns does not require a release of boston.gov, then add the current version of boston.gov).
8. click "Set as the latest release",
9. click the `Save draft` button.

## Project Manager: Release `Production` branch
The Project Manager will edit the draft release notes, finalize and publish them.
1. goto the [release section](https://github.com/CityOfBoston/patterns/releases) of the repository,
2. edit the latest draft release,
3. update the *[PM to complete]* block with narrative related to the release,
4. click "Set as the latest release",
5. click the `Publish release` button.

A Github action <img src="https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2023-02-09/4779927044435_48.png" alt="" style="width: 20px; height: 20px"/> will now fire which will post a message to the slack [#jira-releases channel](https://cityofboston-doit.slack.com/archives/C03UZ01E5N2).

# Release Description Template 
```
## [Copy title of production PR]

### Release Notes
[PM to complete]

### Related Jira tickets
[Add a list of Jira Tickets addressed in this Release, with links to the Jira website]
example: Dig-1839 - [Update residential exemption application in Assessing Online](https://bostondoit.atlassian.net/browse/DIG-1839)

### Linked Drupal Release
[add in the associated Drupal release, or the latest Drupal release if one is not required e.g. v9.2023.2]
```
## Project Manager: Release Jira Tickets 
1. In Jira create a release with the following convention RepositoryName/release version (e.g. Patterns/v2023.1) 
2. The release description should include what was updated and a link to the release notes (e.g. patterns code updates[Release Notes](https://github.com/CityOfBoston/boston.gov-d8/patterns/tag/v2023.1))
3. Attached release fix version to tickets before releasing the tickets. 
