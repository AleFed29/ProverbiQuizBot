//#region variables
const sqlite = require('sqlite-sync');
process.env.NTBA_FIX_319 = 1;
const TOKEN = "1748831692:AAEiMebWMjCpqVTbQHnUrFVcsl02lDdMWs0";
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, {
    polling: true
});
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const link = "https://proverbiquizbot.herokuapp.com/";
var phase = -1;
var passcont = 0;
var username = null;
var enrollpassword = "";
var round = false; //se ancora non ha giocato, annuncia l'inizio del gioco
var risposto = 0; //ha risposto all'ultima domanda posta?
const express = require('express');
const app = express();
//#endregion
//#region database
function SQLite_connection() {
    sqlite.connect("./ProverbiDB.db");
} //, { verbose: console.log });

const content = (sql, params) => {
    //let statement = db.prepare(sql);
    if (params != undefined) //array presente, anche se vuoto
        return params.length > 0 ? sqlite.run(sql, params) : sqlite.run(sql);
    else
        return sqlite.run(sql);
};
const execute = (sql, params) => {
    //let statement = sqlite.prepare(sql);
    if (params != undefined) {
        params.length > 0 ? sqlite.run(sql, params) : sqlite.run();
        return params.length > 0;
    } //array presente, anche se vuoto
    return false;
};
const SQL_Beginning = (sql) => {
    return sql.split(' ')[0];
};

const Operation = (sql, params) => {
    if (SQL_Beginning(sql) == "SELECT")
        return content(sql, params);
    else
        return execute(sql, params);
};


const QuestionById = (id) => {
    return Operation("SELECT Testo FROM Domanda WHERE IdDomanda = ?", [id]);
};

const AnswersandSolutionByQuestionId = (id) => {
    return Operation("SELECT NRispostaGiusta, Risposta1, Risposta2, Rsiposta3 AS Risposta3, Rsiposta4 AS Risposta4 FROM Domanda D INNER JOIN Risposte R ON R.fk_domanda = D.IdDomanda WHERE IdDomanda = ?", [id]);
}
const QuestionLength = () => {
    return Operation("SELECT COUNT(*) AS Length FROM Domanda")[0].Length;
};
const ProverbioLength = () => {
    return Operation("SELECT COUNT(*) AS Length FROM Proverbi")[0].Length;
};
const WinProverbio = (id) => {
    var list = Operation("SELECT Testo FROM Proverbi WHERE IDProverbio in (SELECT FK_Proverbio FROM Appartenenza WHERE FK_Utente = ?)", [id]);
    return list[Math.floor(Math.random() * (list.length - 1))];
};
const AppartenenzaLength = () => {
    return Operation("SELECT COUNT(*) AS Length FROM Appartenenza")[0].Length;
}
const WinProverbioEText = (id) => {
    var list =
        AppartenenzaLength() > 0 ?
        Operation("SELECT IDProverbio, Testo FROM Proverbi WHERE IDProverbio not in (SELECT FK_Proverbio FROM Appartenenza WHERE FK_Utente = ?)", [id]) :
        Operation("SELECT IDProverbio, Testo FROM Proverbi");
    return list[Math.floor(Math.random() * (list.length - 1))];
};
const IdProverbioByText = (text) => {
    let element = Operation("SELECT IDProverbio FROM Proverbi WHERE Testo = ?", [text]);
    console.log(element); //[0].Id
    return element;
};
const Proverbis = (id) => {
    return Operation("SELECT Testo FROM Proverbi WHERE IDProverbio in (SELECT FK_Proverbio FROM Appartenenza WHERE FK_Utente = ?)", [id]);
};
const Proverbis_piu_id = (id) => {
    return Operation("SELECT IDProverbio, Testo FROM Proverbi WHERE IDProverbio in (SELECT FK_Proverbio FROM Appartenenza WHERE FK_Utente = ?)", [id]);
};
const RandQuest_and_Answers = () => {
    let id = Math.floor(Math.random() * QuestionLength() - 1) + 1;
    let result = { "Question": QuestionById(id), "Answers": AnswersandSolutionByQuestionId(id) };
    return result;
}
const Login = (username, password) => {
    return Operation("SELECT Id FROM Utente WHERE username = ? and password = ?", [username, password])[0].Id != null;
};

const Enroll = (username, password) => {
    return Operation("INSERT INTO Utente(username, password) VALUES(?,?)", [username, password]);
};

const passByuser = (user) => {
    return Operation("SELECT password FROM Utente WHERE username = ?", [user])[0].Password;
};
const CountProverbi = (id) => {
    if (id == '?') return ProverbioLength();
    return Operation("SELECT COUNT(*) AS Cont FROM Appartenenza WHERE fk_utente = ?", [id])[0].Cont;
};
const UserById = (id) => {
    return Operation("SELECT username FROM Utente WHERE id = ?", [id])[0].Username;
};
const IdByUser = (user) => {
    if (user == "SUPERMASTER") return '?';
    return Operation("SELECT id FROM Utente WHERE username = ?", [user])[0].Id;
};
const RandProverbio = (user) => {
    if (user == null || user == undefined) { return null; }
    let Proverbi = Proverbis(IdByUser(user));
    let provID = Math.floor(Math.random() * Proverbi.length - 2) + 1;
    return IsConquistato(IdByUser(username), provID) ? Proverbi[provID - 1].Testo : "Prova a vincere questo proverbio: " + provID.toString();
};
const AssignProverbio = (user, prov_id) => {
    if (user == "SUPERMASTER" || CountProverbi() == ProverbioLength()) return true;
    return Operation("INSERT INTO Appartenenza(FK_Utente, FK_Proverbio) VALUES(?,?)", [IdByUser(user), prov_id]);
};
const IsConquistato = (id, num) => {
    if (id == "?") return true;
    let conq = Operation("SELECT FK_Proverbio FROM Appartenenza WHERE fk_utente = ? and FK_Proverbio = ?", [id, num]); //[0].FK_Proverbio
    return conq != null;
};
const ProverbioByNum = (id, num) => {
    if (num > ProverbioLength()) return "Non conosciamo così tanti proverbi.";
    let conquista = Operation("SELECT Testo FROM Proverbi WHERE IdProverbio = ?", [num]);
    return IsConquistato(id, num) ? conquista[0].Testo : "Il proverbio richiesto deve essere ancora conquistato, vincilo con noi!";
};
const ProverbioByNumSuperMaster = (num, livello) => {
    return (livello == "SuperMaster" && num < ProverbioLength()) ? Operation("SELECT Testo FROM Proverbi WHERE IdProverbio = ?", [num])[0].Testo : "Non conosciamo così tanti proverbi.";
};
const ProverbioByRandSuperMaster = (livello) => {
    return (livello == "SuperMaster") ? ProverbioByNumSuperMaster(Math.floor(Math.random() * ProverbioLength() - 1) + 1, "SuperMaster") : "Spiacenti, siamo a corto di proverbi.";
}
const Stats = (username) => {
    let id = username != "SUPERMASTER" ? (username == undefined || username == null ? null : IdByUser(username)) : "?";
    if (id == null) {
        return "Noi hai effettuato l'accesso. Effettua l'accesso per visualizzare le tue statistiche.";
    }
    let Proverbi_Got = CountProverbi(id);
    let livello = Proverbi_Got < 10 ? "Principiante" :
        Proverbi_Got < 50 ? "Proverbista Novello" :
        Proverbi_Got < 100 ? "Apprendista Proverbista" :
        Proverbi_Got < 200 ? "Proverbista Provetto" :
        Proverbi_Got < 350 ? "Esperto di Proverbi" :
        Proverbi_Got < 425 ? "Cultore dei Proverbi" :
        Proverbi_Got < 500 ? "Maestro dei Proverbi" :
        Proverbi_Got < 750 ? "Leggenda dei Proverbi" :
        Proverbi_Got < 850 ? "SuperLeggenda dei Proverbi" :
        Proverbi_Got < 950 ? "Proverbista Supremo" :
        Proverbi_Got < 1000 ? "SuperSaggio dei Proverbi" : "SuperMaster";
    let Proverbio_now = ProverbioByNum(id, Math.floor(Math.random() * ProverbioLength() - 1) + 1);
    var string_sito = "\n Visita il nostro sito per ulteriori informazioni!";
    var link_sito = string_sito.link(link); //HOST.toString() + ":" + PORT.toString() +;
    return "Utente numero: " + id + "\n Nome: " + username + "\n Proverbi vinti: " + Proverbi_Got + "\n Livello: " + livello + " \n Proverbio da leggere: " + Proverbio_now + link_sito;
}
const StatsSuperMaster = () => {
    var string_sito = "\n Visita il nostro sito per ulteriori informazioni!";
    var link_sito = string_sito.link(link);
    return "Utente numero: 0" + "\n Nome: ? \n Proverbi vinti: ? \n Livello: SuperMaster \n Proverbio da leggere: " + ProverbioByRandSuperMaster("SuperMaster") + link_sito;
}
const UserExists = (user) => {
    let username = Operation("SELECT username FROM utente WHERE username = ?", [user])[0]; //.Username non dà errore solo se c'è qualcosa
    return username != null && username != undefined;
}

function SQLite_close() {
    sqlite.close();
}
//#endregion

app.listen(PORT, HOST, function() {
    console.log("Server attivo nella porta " + PORT);
});

app.set("view engine", "ejs");
app.get("/", function(req, res) {
    res.render("index", {
        "username": username
    });
});
app.get("/proverbi", function(req, res) {
    res.render("proverbi", {
        "username": username,
        "vinti_proverbi": Proverbis_piu_id(username)
    });
});
app.get("/aboutus", function(req, res) {
    res.render("aboutus", {
        "username": username
    });
});
//#region roots
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Benvenuto/a nel quiz dei proverbi italiani 'A caccia di proverbi'! \n");
    bot.sendMessage(msg.chat.id, "Digitare '/login' per poter accedere alla tua utenza.");
    bot.sendMessage(msg.chat.id, "Digitare '/enroll' per poter creare una nuova utenza.");
    bot.sendMessage(msg.chat.id, "Digitare '/play' per cominciare a giocare, '/stats' per conoscere le tue statistiche.");
});
bot.onText(/\/play/, (msg) => {
    if (username != undefined && username != null) {
        bot.sendMessage(msg.chat.id, "Sei pronto per giocare?");
        bot.sendMessage(msg.chat.id, "'/Yes'");
        bot.sendMessage(msg.chat.id, "'/No'");
        phase = 4;
    } else {
        bot.sendMessage(msg.chat.id, "Devi eseguire il login.");
    }
});
bot.onText(/\/enroll/, (msg) => {
    passcont = 0;
    if (username != undefined || username != null) {
        bot.sendMessage(msg.chat.id, "Non ci si può registrare se si è autenticati con un'altro account. Effettua '/logout' e riprova.");
    } else {
        SQLite_connection();
        phase = 0;
        bot.sendMessage(msg.chat.id, "Invia lo username.");
    }
});
bot.onText(/\/login/, (msg) => {
    passcont = 0;
    if (username != undefined || username != null) {
        bot.sendMessage(msg.chat.id, "Non ci si può registrare se si è autenticati con un'altro account. Effettua '/logout' e riprova.");
    } else {
        SQLite_connection();
        phase = 2;
        bot.sendMessage(msg.chat.id, "Inserire lo username.");
    }
});
bot.onText(/\/rockenroll/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Modalità SuperMaster attivata.');
    username = "SUPERMASTER";
    phase = -1;
});
bot.onText(/\/logout/, (msg) => {
    bot.sendMessage(msg.chat.id, "Sei sicuro di voler uscire?");
    bot.sendMessage(msg.chat.id, "'/Yes'");
    bot.sendMessage(msg.chat.id, "'/No'");
    phase = 7;
});
bot.onText(/\/Yes/, (msg) => {
    if (phase == 7) {
        phase = -1;
        if (username != null && username != undefined) bot.sendMessage(msg.chat.id, "Arrivederci " + username + ", grazie per aver giocato con noi!");
        username = null;
    } else {
        if (!round) {
            bot.sendMessage(msg.chat.id, "Bene, cominciamo...");
            round = true;
        }
        var data = RandQuest_and_Answers();
        let question = data.Question[0].Testo;
        let answers = data.Answers[0];
        var options = (answers.Risposta4 === undefined) ? {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: answers.Risposta1,
                        callback_data: "1",
                    }],
                    [{
                        text: answers.Risposta2,
                        callback_data: "2",
                    }],
                    [{
                        text: answers.Risposta3,
                        callback_data: "3",
                    }]
                ],
            }),
        } : {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: answers.Risposta1,
                        callback_data: "1",
                    }],
                    [{
                        text: answers.Risposta2,
                        callback_data: "2",
                    }],
                    [{
                        text: answers.Risposta3,
                        callback_data: "3",
                    }],
                    [{
                        text: answers.Risposta4,
                        callback_data: "4"
                    }]
                ],
            }),
        };
        risposto = 0;
        //invia domanda, poi rispondi
        bot.sendMessage(msg.chat.id, question, options);
        setTimeout(() => { //si hanno 10 secondi per rispondere
            if (risposto != 1) {
                risposto = 1;
                bot.sendMessage(msg.chat.id, "Spiacente, tempo scaduto! Rispondi più velocemente la prossima volta. \n Continuare?");
                bot.sendMessage(msg.chat.id, "'/Yes'");
                bot.sendMessage(msg.chat.id, "'/No'");
            }
        }, 10000);
        bot.on("callback_query", function onCallbackQuery(callbackQuery) {
            const action = callbackQuery.data;
            const msg = callbackQuery.message;
            const opts = {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            };
            if (risposto > 0) return;
            if (answers.NRispostaGiusta == action) {
                risposto = 1;
                var provlist = WinProverbioEText(username);
                var idProv = provlist["IDProverbio"];
                //var idProv = IdProverbioByText(prov);
                var prov = provlist["Testo"];
                if (AssignProverbio(username, idProv)) {
                    bot.sendMessage(msg.chat.id, "Ottimo, è corretto! \n Hai vinto un proverbio! \n Proverbio n." +
                        idProv.toString() + ": " + prov + "");
                    bot.sendMessage(msg.chat.id, "Continuare?");
                    bot.sendMessage(msg.chat.id, "'/Yes'");
                    bot.sendMessage(msg.chat.id, "'/No'");
                }
            } else {
                risposto = 1;
                bot.sendMessage(msg.chat.id, "Spiacente, hai sbagliato!");
                bot.sendMessage(msg.chat.id, "Continuare?");
                bot.sendMessage(msg.chat.id, "'/Yes'");
                bot.sendMessage(msg.chat.id, "'/No'");
                return;
            }
        });
    }

});
bot.onText(/\/No/, (msg) => {
    bot.sendMessage(msg.chat.id, phase == 4 ? "Ok, gioco terminato." : "Ok, azione annullata.");
    if (phase == 4) round = false;
    phase = -1;
});
bot.onText(/\/read/, (msg) => {
    bot.sendMessage(msg.chat.id, "Inserire un numero oppure 'r' se si vuole un random.");
    phase = 6;
});
bot.onText(/\/stats/, (msg) => {
    username == "SUPERMASTER" ? bot.sendMessage(msg.chat.id, StatsSuperMaster(), { parse_mode: "HTML" }) :
        bot.sendMessage(msg.chat.id, Stats(username), { parse_mode: "HTML" });
});
bot.on('message', (msg) => {
    switch (phase) {
        case 0: // enroll username
            if (!(msg.text.toString().split(' ').length > 1) && !UserExists(msg.text.toString()) && msg.text.toString() != "SUPERMASTER") {
                username = msg.text.toString(); //se username non presenta spazi
                phase = 1;
                bot.sendMessage(msg.chat.id, "Bene " + username + ", invia la password.");
            } else
                bot.sendMessage(msg.chat.id, "Lo username non rispetta i requisiti. Riprovare.");
            break;
        case 1: //enroll password
            //problema: password non inserita al primo colpo e stessa stringa dice che sia diversa
            if (!(msg.text.toString().split(' ').length > 1)) { //se psw non ha spazi
                if (passcont == 0) {
                    passcont++;
                    enrollpassword = msg.text.toString(); //magari meglio hashare già qua.
                    bot.sendMessage(msg.chat.id, "Conferma password.");
                } else {
                    if (msg.text.toString() == enrollpassword) {
                        //inserire user e password nel db.
                        enrollpassword = null; //non rischiamo attacchi hacker facili.
                        if (Enroll(username, msg.text.toString())) {
                            bot.sendMessage(msg.chat.id, "Registrazione avvenuta con successo. Dopo " + passcont.toString() + " tentativi.");
                            bot.sendMessage(msg.chat.id, "Ora puoi giocare come " + username + " con il comando '/play'");
                            phase = -1;
                        } else {
                            bot.sendMessage(msg.chat.id, "Registrazione fallita (username già preso). Riprovare.");
                        }
                    } else {
                        bot.sendMessage(msg.chat.id, "Password di conferma sbagliata, riprova.");
                        passcont++;
                        if (passcont > 5) {
                            bot.sendMessage(msg.chat.id, "Troppi tentativi falliti.");
                            return;
                        }
                    }
                }
            } //'(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[AZ])(?=.*[az]).*$'
            else {
                bot.sendMessage(msg.chat.id, "La password non rispetta i requisiti. Riprovare.");
                passcont++;
            }
            break;
        case 2: //login username 
            username = UserExists(msg.text.toString()) ? msg.text.toString() : null;
            phase = username != null ? 3 : 2;
            if (username != null) bot.sendMessage(msg.chat.id, "Benvenuto " + username + ", invia la password.");
            else bot.sendMessage(msg.chat.id, "Lo username non esiste, riprovare.");
            break;
        case 3: //login password
            let pass = passByuser(username);
            if (pass == msg.text.toString()) {
                bot.sendMessage(msg.chat.id, "Bene, siamo pronti per giocare.");
                phase = -1;
            } else {
                bot.sendMessage(msg.chat.id, "Password sbagliata.");
                passcont++;
                if (passcont > 5) {
                    bot.sendMessage(msg.chat.id, "Troppi tentativi falliti.");
                    return;
                } else {
                    bot.sendMessage(msg.chat.id, "Riprova.");
                }
            }
            break;
        case 4: //play
            //inserire uno stop al gioco
            break;
        case 5: //rockenroll
            break;
        case 6: //read
            let number = parseInt(msg.text.toString());
            if (username != null && username != undefined) {
                let id = IdByUser(username);
                bot.sendMessage(msg.chat.id,
                    number.toString() == 'NaN' || number.toString() == "0" ?
                    RandProverbio(username) :
                    "Il proverbio n°" + number.toString() + " è: " + '"' + IsConquistato(id, number) ? ProverbioByNum(id, number) : "Non ancora vinto." + '"');
            } else {
                bot.sendMessage(msg.chat.id, "Non ti sei autenticato, autenticati per favore.");
            }
            phase = -1;
            break;
        case 7: //logout
            break; //logout e stats non hanno bisogno di messaggi
        default:
            break;
    }
});
bot.on("polling_error", console.log);
//#endregion roots