import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import Slide from '@mui/material/Slide'
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Paper from '@mui/material/Paper';
import Card from './Card'
import { useDispatch, useSelector } from 'react-redux';
import {request_post, request_get, onOrder} from '../config'
import CircularProgress from '@mui/material/CircularProgress';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const steps = ['Element de la commande', 'Finalisation'];


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function AddOrder(props) {
    const [open, setOpen] = React.useState(true);
  
    const [table, setTable] = React.useState(null);
    const [selects, setSelect] = React.useState([]);
    const [plateQuantity, setPlat] = React.useState(1);
    const [status, setStatus] = React.useState(null);
    const [loanding, setDisabled] = React.useState(false);

    const consommables = useSelector(p => p.consommables)
    const tables = useSelector(p => p.tables)
    const socket = useSelector(p => p.socket)

    const dispatch = useDispatch()

    React.useEffect(function(){
      onLoadTyeOnWait()
    }, [])

    async function onLoadTyeOnWait(){
      try {
        const result =  await request_get('order_states?page=1&task_name=en_attente')
        if(result&&result['hydra:member']&&result['hydra:member'].length > 0){
          setStatus(result['hydra:member'][0])
        }
      } catch (error) {
        console.log('onLoadTyeOnWait', error)
      }
    }

    const handleChange = (event) => {
        setTable(event.target.value);
    };
  
    const handleClose = () => {
      setSelect([])
      setTable(null)
      setActiveStep(0)
      setCompleted({})
      props.handleClose(false);
    };

    const options = consommables.map((option) => {
        const firstLetter = option.name[0].toUpperCase();
        return {
          firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
          quantity: 1,
          ...option,
        };
    });

    const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState({});

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? // It's the last step, but not all steps have been completed,
          // find the first step that has been completed
          steps.findIndex((step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };
  



  async function onSaveCommande(){
    try {
      console.log('started saving')
      const now = new Date()
      const obx = {
          table: table,
          consommabes: selects.map(c => c['@id']),
          status: status['@id'],
          time: new Date().toISOString(),
          random: Math.floor(Math.random() * 5000)+"_"+now.getTime(),
          quantity: parseInt(plateQuantity),
          price: renderPrice(),
          task: status.taskname
      }
      setDisabled(true)

      console.log('obx after pos ****************', obx)
      const result = await request_post("commandes", obx)
      const r = await socket.send(JSON.stringify(obx));
      //await dispatch({type: "NEW_ORDER", random: obx.random})
      await onOrder(obx)
      setDisabled(false)
      
      handleClose()
    } catch (error) {
      //setLoand(false)
      setDisabled(false)
      console.log('error ==', error)
    }


  }
  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    if(activeStep ===1){
        onSaveCommande();
    }else{
        handleNext()
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };
  function changedQ(id, quantity){
    setSelect(selects.map(t => {
        if(t.id === id) return {...t, quantity: quantity}
        return t
    }))

  }

  function renderPrice(){
      let price = 0;
      selects.map(s => {
          price = price + (isNaN(parseInt(s.quantity))? 1 : parseInt(s.quantity)) * s.price
      })
      return price * (isNaN(parseInt(plateQuantity)) ? 1 : parseInt(plateQuantity))
  }

 // const date = new Date();
  const opt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  //date.toLocaleDateString('fr-FR', opt);
  const date = new Date().toLocaleString('fr-FR', opt)

  
    return (
      <div style={{backgroundColor: '#EAEEF3'}}>
        <Dialog
          fullScreen
          open={props.open}
          onClose={handleClose}
          TransitionComponent={Transition}
          style={{backgroundColor: '#EAEEF3'}}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Ajout d'une commande
              </Typography>
            </Toolbar>
          </AppBar>
          <div style={{paddingTop: '40px', paddingInline: '200px'}}>

            <Box sx={{ width: '100%' }}>
                <Stepper nonLinear activeStep={activeStep}>
                    {steps.map((label, index) => (
                    <Step key={label} completed={completed[index]}>
                        <StepButton color="inherit" onClick={handleStep(index)}>
                        {label}
                        </StepButton>
                    </Step>
                    ))}
                </Stepper>

                
                <div>
                    <React.Fragment>

                        
                        {activeStep===0&&
                            <div style={{paddingTop: '50px'}}>
                                <Autocomplete
                                    multiple
                                    
                                    id="size-small-outlined-multi"
                                    options={options.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                                    // groupBy={(option) => option.firstLetter}
                                    // getOptionLabel={(option) => option.title}
                                    //groupBy={(option) => option.typeConsommable?.name}
                                    getOptionLabel={(option) => option?.name}
                                    defaultValue={selects}
                                    onChange={(e,v) => setSelect(v)}
                                    variant="outlined"
                                    disableCloseOnSelect
                                    renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        label="Multiple values"
                                        placeholder="Favorites"
                                    />
                                    )}
                                />

                                <br/>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        '& > :not(style)': {
                                        m: 1,
                                        width: '48%',
                                        height: 128,
                                        },
                                    }}
                                >
                                    {selects.map((k, i) =>
                                        <Card key={i} row={k} changedQ={changedQ} />
                                    )}
                                </Box>
                            </div>
                        }
                        {activeStep===1&&
                            <div style={{paddingTop: '100px'}}>
                                <div style={{marginLeft: '25%'}}>
                                    <FormControl
                                        style={{width: '500px'}}
                                    >
                                        <InputLabel id="demo-simple-select-label">Selectionner la table</InputLabel>
                                        <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={table}
                                        label="Sekectionner la table"
                                        onChange={handleChange}
                                        >
                                            {tables.map((t, k) =>
                                                <MenuItem value={t['@id']} t={k}>{t.name}</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        style={{width: '500px', marginTop: '20px'}}
                                        type="number"
                                        value={plateQuantity}
                                        onChange={(e)=>setPlat(e.target.value)}
                                        label="Nombre de plat"
                                    />
                                </div>
                                <div>
                                    <Paper elevation={3} >
                                        <div style={{padding: '20px'}}>
                                            Date: {date}
                                            <br/>
                                            Table: {table&&table.trim() !== ""&&tables.filter(t =>t['@id'] === table)[0].name}
                                            
                                            <br/>
                                               Total a payé: {renderPrice()}  FCFA 
                                            <br/>
                                        </div>
                                    </Paper>
                                </div>
                            </div>
                        }

                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>


                        <Button
                            color="inherit"
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{ mr: 1 }}
                        >
                            Precedent
                        </Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        {/* <Button onClick={handleNext} sx={{ mr: 1 }}>
                            Suivant
                        </Button> */}
                        {
                            activeStep !== steps.length &&
                            (
                            <>
                              {activeStep === 1 ?
                                <Button onClick={handleComplete} variant="contained" disabled={loanding || !table}>
                                    {loanding && <CircularProgress  size={20} />}
                                    Sauver la commande
                                </Button> 
                                :
                              <Button onClick={handleComplete} disabled={selects.length === 0}>
                                  Suivant
                              </Button>
                              }
                            </>
                            )
                        }
                        </Box>
                    </React.Fragment>
                </div>
            </Box>
          </div>
        </Dialog>
      </div>
    );
  }


const top100Films = [
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather: Part II', year: 1974 },
  { title: 'The Dark Knight', year: 2008 },
  { title: '12 Angry Men', year: 1957 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Pulp Fiction', year: 1994 },
  {
    title: 'The Lord of the Rings: The Return of the King',
    year: 2003,
  },
  { title: 'The Good, the Bad and the Ugly', year: 1966 },
  { title: 'Fight Club', year: 1999 },
  {
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    year: 2001,
  },
  {
    title: 'Star Wars: Episode V - The Empire Strikes Back',
    year: 1980,
  },
  { title: 'Forrest Gump', year: 1994 },
  { title: 'Inception', year: 2010 },
  {
    title: 'The Lord of the Rings: The Two Towers',
    year: 2002,
  },
  { title: "One Flew Over the Cuckoo's Nest", year: 1975 },
  { title: 'Goodfellas', year: 1990 },
  { title: 'The Matrix', year: 1999 },
  { title: 'Seven Samurai', year: 1954 },
  {
    title: 'Star Wars: Episode IV - A New Hope',
    year: 1977,
  },
  { title: 'City of God', year: 2002 },
  { title: 'Se7en', year: 1995 },
  { title: 'The Silence of the Lambs', year: 1991 },
  { title: "It's a Wonderful Life", year: 1946 },
  { title: 'Life Is Beautiful', year: 1997 },
  { title: 'The Usual Suspects', year: 1995 },
  { title: 'Léon: The Professional', year: 1994 },
  { title: 'Spirited Away', year: 2001 },
  { title: 'Saving Private Ryan', year: 1998 },
  { title: 'Once Upon a Time in the West', year: 1968 },
  { title: 'American History X', year: 1998 },
  { title: 'Interstellar', year: 2014 },
  { title: 'Casablanca', year: 1942 },
  { title: 'City Lights', year: 1931 },
  { title: 'Psycho', year: 1960 },
  { title: 'The Green Mile', year: 1999 },
  { title: 'The Intouchables', year: 2011 },
  { title: 'Modern Times', year: 1936 },
  { title: 'Raiders of the Lost Ark', year: 1981 },
  { title: 'Rear Window', year: 1954 },
  { title: 'The Pianist', year: 2002 },
  { title: 'The Departed', year: 2006 },
  { title: 'Terminator 2: Judgment Day', year: 1991 },
  { title: 'Back to the Future', year: 1985 },
  { title: 'Whiplash', year: 2014 },
  { title: 'Gladiator', year: 2000 },
  { title: 'Memento', year: 2000 },
  { title: 'The Prestige', year: 2006 },
  { title: 'The Lion King', year: 1994 },
  { title: 'Apocalypse Now', year: 1979 },
  { title: 'Alien', year: 1979 },
  { title: 'Sunset Boulevard', year: 1950 },
  {
    title: 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
    year: 1964,
  },
  { title: 'The Great Dictator', year: 1940 },
  { title: 'Cinema Paradiso', year: 1988 },
  { title: 'The Lives of Others', year: 2006 },
  { title: 'Grave of the Fireflies', year: 1988 },
  { title: 'Paths of Glory', year: 1957 },
  { title: 'Django Unchained', year: 2012 },
  { title: 'The Shining', year: 1980 },
  { title: 'WALL·E', year: 2008 },
  { title: 'American Beauty', year: 1999 },
  { title: 'The Dark Knight Rises', year: 2012 },
  { title: 'Princess Mononoke', year: 1997 },
  { title: 'Aliens', year: 1986 },
  { title: 'Oldboy', year: 2003 },
  { title: 'Once Upon a Time in America', year: 1984 },
  { title: 'Witness for the Prosecution', year: 1957 },
  { title: 'Das Boot', year: 1981 },
  { title: 'Citizen Kane', year: 1941 },
  { title: 'North by Northwest', year: 1959 },
  { title: 'Vertigo', year: 1958 },
  {
    title: 'Star Wars: Episode VI - Return of the Jedi',
    year: 1983,
  },
  { title: 'Reservoir Dogs', year: 1992 },
  { title: 'Braveheart', year: 1995 },
  { title: 'M', year: 1931 },
  { title: 'Requiem for a Dream', year: 2000 },
  { title: 'Amélie', year: 2001 },
  { title: 'A Clockwork Orange', year: 1971 },
  { title: 'Like Stars on Earth', year: 2007 },
  { title: 'Taxi Driver', year: 1976 },
  { title: 'Lawrence of Arabia', year: 1962 },
  { title: 'Double Indemnity', year: 1944 },
  {
    title: 'Eternal Sunshine of the Spotless Mind',
    year: 2004,
  },
  { title: 'Amadeus', year: 1984 },
  { title: 'To Kill a Mockingbird', year: 1962 },
  { title: 'Toy Story 3', year: 2010 },
  { title: 'Logan', year: 2017 },
  { title: 'Full Metal Jacket', year: 1987 },
  { title: 'Dangal', year: 2016 },
  { title: 'The Sting', year: 1973 },
  { title: '2001: A Space Odyssey', year: 1968 },
  { title: "Singin' in the Rain", year: 1952 },
  { title: 'Toy Story', year: 1995 },
  { title: 'Bicycle Thieves', year: 1948 },
  { title: 'The Kid', year: 1921 },
  { title: 'Inglourious Basterds', year: 2009 },
  { title: 'Snatch', year: 2000 },
  { title: '3 Idiots', year: 2009 },
  { title: 'Monty Python and the Holy Grail', year: 1975 },
];
