import csv


f = open("s34_labEvents.csv","a")

with open('LABEVENTS.csv') as csvDataFile:
    csvReader = csv.reader(csvDataFile)
    mywriter = csv.writer(f)
    for row in csvReader:
        if row[1] = 34:
            print(row)
            mywriter.writerow(row)

f.close()
 
