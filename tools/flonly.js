const { chalk, inquirer, _, fs, instagram, print, delay } = require("./index.js");

(async () => {
    print(
        chalk`{bold.green
  ▄▄▄▄▄            ▄▄▌  .▄▄ · ▪   ▄▄ • 
  •██  ▪     ▪     ██•  ▐█ ▀. ██ ▐█ ▀ ▪
   ▐█.▪ ▄█▀▄  ▄█▀▄ ██▪  ▄▀▀▀█▄▐█·▄█ ▀█▄
   ▐█▌·▐█▌.▐▌▐█▌.▐▌▐█▌▐▌▐█▄▪▐█▐█▌▐█▄▪▐█
   ▀▀▀  ▀█▄▀▪ ▀█▄▀▪.▀▀▀  ▀▀▀▀ ▀▀▀·▀▀▀▀ 

  Ξ TITLE  : Folow Like Only (Followers Target)
  Ξ UPDATE : Wednesday, August 4, 2021 (GMT+8)
           : TESTED "OK" BUG? YouTellMe!
    }`
    );
    const questions = [
        {
            type: "input",
            name: "username",
            message: "Input Username:",
            validate: (val) => val.length != 0 || "Please input username!",
        },
        {
            type: "password",
            name: "password",
            mask: "*",
            message: "Input password:",
            validate: (val) => val.length != 0 || "Please input password!",
        },
        {
            type: "input",
            name: "target",
            message: "Input target's username (without '@'):",
            validate: (val) => val.length != 0 || "Please input target's username!",
        },
        {
            type: "input",
            name: "perExec",
            message: "Input limit per-execution:",
            validate: (val) => /[0-9]/.test(val) || "Only input numbers",
        },
        {
            type: "input",
            name: "delayTime",
            message: "Input sleep time (in milliseconds):",
            validate: (val) => /[0-9]/.test(val) || "Only input numbers",
        },
    ];

    try {
        const { username, password, target, perExec, delayTime } = await inquirer.prompt(questions);
        const ig = new instagram(username, password);
        print("Try to Login . . .", "wait", true);
        const login = await ig.login();
        print(`Logged in as @${login.username} (User ID: ${login.pk})`, "ok");
        print(`Collecting information of @${target} . . .`, "wait");
        const id = await ig.getIdByUsername(target),
            info = await ig.userInfo(id);
        if (!info.is_private) {
            print(`@${target} (User ID: ${id}) => Followers: ${info.follower_count}, Following: ${info.following_count}`, "ok");
            print("Collecting followers . . .", "wait");
            const targetFollowers = await ig.followersFeed(id);
            print(`Doing task with ratio ${perExec} target / ${delayTime} milliseconds \n`, "wait");
            do {
                let items = await targetFollowers.items();
                items = _.chunk(items, perExec);
                for (let i = 0; i < items.length; i++) {
                    await Promise.all(
                        items[i].map(async (follower) => {
                            const status = await ig.friendshipStatus(follower.pk);
                            if (!follower.is_private && !status.following && !status.followed_by) {
                                const media = await ig.userFeed(follower.pk),
                                    lastMedia = await media.items();
                                if (lastMedia.length != 0 && lastMedia[0].pk) {
                                    const task = [ig.follow(follower.pk), ig.like(lastMedia[0].pk)];
                                    let [follow, like] = await Promise.all(task);
                                    follow = follow ? chalk.bold.green(`Follow`) : chalk.bold.red("Follow");
                                    like = like ? chalk.bold.green("Like") : chalk.bold.red("Like");
                                    print(`▲ @${follower.username} ⇶ [${follow}, ${like}]`);
                                } else print(chalk`▼ @${follower.username} ⇶ {yellow No posts yet, Skip.}`);
                            } else print(chalk`▼ @${follower.username} ⇶ {yellow Private or already followed/follows you, Skip.}`);
                        })
                    );
                    if (i < items.length - 1) print(`Current Account: (${login.username}) » Delay: ${perExec}/${delayTime}ms \n`, "wait", true);
                    await delay(delayTime);
                }
            } while (targetFollowers.moreAvailable);
            print(`Status: All Task done!`, "ok", true);
        } else print(`@${target} is private account`, "err");
    } catch (err) {
        print(err, "err");
    }
})();
//by 1dcea8095a18ac73b764c19e40644b52 116 111 111 108 115 105 103  118 51
